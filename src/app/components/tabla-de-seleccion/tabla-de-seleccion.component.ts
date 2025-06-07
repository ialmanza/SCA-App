import { Component, OnInit, ChangeDetectorRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { forkJoin, Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ComparisonMode } from '../../models/comparacion';
import { Opcion } from '../../models/interfaces';
import { OpcionesService } from '../../services/supabaseServices/opciones.service';
import { CommonModule } from '@angular/common';
import { ComparisonModeService } from '../../services/supabaseServices/comparison-mode.service';
import { ComparisonCellService } from '../../services/supabaseServices/comparison-cell.service';
import { PathModalComponent } from '../path-modal/path-modal.component';
import { PathDescriptionsService } from '../../services/supabaseServices/path-descriptions.service';
import { PathAreaScoreService, PathAreaScore } from '../../services/supabaseServices/path-area-score.service';
import { supabase } from '../../config/supabase.config';
import { RangoPuntuacionesComponent } from '../rango-puntuaciones/rango-puntuaciones.component';

interface PathDescription {
  id: string;
  project_id: string;
  hex_code: string;
  path_descriptions: string[];
}

interface PathValues {
  id: string;
  hexa: string;
  path: string[];
  descriptions?: string[];
  values: {
    area: string;
    symbol: string;
    value: number;
    isValid: boolean;
    minScore: number | null;
  }[];
  areaScores?: { [areaName: string]: number };
}

@Component({
  selector: 'app-tabla-de-seleccion',
  standalone: true,
  imports: [CommonModule, PathModalComponent, RangoPuntuacionesComponent],
  providers: [
    OpcionesService,
    ComparisonModeService,
    ComparisonCellService,
    PathDescriptionsService,
    PathAreaScoreService
  ],
  templateUrl: './tabla-de-seleccion.component.html',
  styleUrl: './tabla-de-seleccion.component.css'
})
export class TablaDeSeleccionComponent implements OnInit, OnChanges {
  opciones: Opcion[] = [];
  paths: PathValues[] = [];
  comparisonModes: ComparisonMode[] = [];
  selectedPath: { hexa: string; path: string[] } | null = null;
  isModalOpen = false;
  optionIdMap: Map<string, Opcion> = new Map();
  pathAreaScores: PathAreaScore[] = [];
  isCalculatingScores = false;
  allCells: any[] = [];
  modeEmojiMap: Map<string, string> = new Map();

  @Input() projectId = '';
  isLoading = false;
  error: string | null = null;

  filteredPaths: PathValues[] = [];
  minScore: number | null = null;
  maxScore: number | null = null;

  constructor(
    private opcionService: OpcionesService,
    private comparisonModeService: ComparisonModeService,
    private comparisonCellService: ComparisonCellService,
    private cdr: ChangeDetectorRef,
    private pathDescriptionsService: PathDescriptionsService,
    private pathAreaScoreService: PathAreaScoreService
  ) {}

  ngOnInit(): void {
    if (this.projectId && this.projectId.trim() !== '') {
      this.loadData();
    } else {
      this.error = 'No se ha proporcionado un ID de proyecto válido';
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectId'] &&
        changes['projectId'].currentValue &&
        changes['projectId'].currentValue !== changes['projectId'].previousValue) {
      this.error = null;
      this.loadData();
    }
  }

  loadData(): void {
    if (!this.projectId || this.projectId.trim() === '') {
      this.error = 'No se ha proporcionado un ID de proyecto válido';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.error = null;

    const opciones$ = from(this.opcionService.getOpcionesByProject(this.projectId))
      .pipe(
        catchError(err => {
          this.error = `Error al cargar opciones: ${err.message || JSON.stringify(err)}`;
          this.isLoading = false;
          return of([]);
        })
      );

    const comparisonModes$ = from(this.comparisonModeService.getComparisonModesByProject(this.projectId))
      .pipe(
        map((modes: ComparisonMode[]) => {
          this.modeEmojiMap.clear();
          modes.forEach(mode => {
            this.modeEmojiMap.set(mode.id, mode.symbol);
          });
          return modes.sort((a, b) => Number(a.order_num) - Number(b.order_num));
        }),
        catchError(err => {
          this.error = `Error al cargar modos de comparación: ${err.message || JSON.stringify(err)}`;
          this.isLoading = false;
          return of([]);
        })
      );

    forkJoin({
      paths: from(supabase
        .from('path_descriptions')
        .select('*')
        .eq('project_id', this.projectId)
        .then(({ data, error }: { data: PathDescription[] | null, error: any }) => {
          if (error) throw error;
          return data || [];
        }))
        .pipe(catchError(err => {
          this.error = `Error al cargar paths: ${err.message || JSON.stringify(err)}`;
          this.isLoading = false;
          return of([]);
        })),
      modes: comparisonModes$,
      opciones: opciones$,
      cellValues: this.comparisonCellService.getComparisonCellsByProject(this.projectId),
      pathAreaScores: this.pathAreaScoreService.getProjectPathAreaScores(this.projectId)
    }).subscribe({
      next: async ({ paths, modes, opciones, cellValues, pathAreaScores }) => {
        try {
          this.allCells = cellValues;
          this.opciones = opciones;
          this.optionIdMap.clear();
          opciones.forEach(opcion => {
            this.optionIdMap.set(opcion.id, opcion);
          });

          this.pathAreaScores = pathAreaScores;
          this.comparisonModes = modes;

          this.paths = paths.map((path: PathDescription) => {
            const pathValues: PathValues = {
              id: path.id,
              hexa: path.hex_code,
              path: path.path_descriptions,
              descriptions: path.path_descriptions,
              values: modes.map(mode => {
                const cellValue = cellValues.find(
                  cell => cell.opcion_id === path.id && cell.mode_id === mode.id
                );

                return {
                  area: mode.id,
                  symbol: mode.symbol,
                  value: cellValue ? Number(cellValue.value) : 0,
                  minScore: mode.puntuacion_minima || null,
                  isValid: false
                };
              }),
              areaScores: {}
            };

            const scores = pathAreaScores.filter(score => score.path_id === path.id);
            if (scores && scores.length > 0) {
              scores.forEach(score => {
                if (pathValues.areaScores) {
                  pathValues.areaScores[score.area_rotulo] = score.score;
                }
              });
            }

            return pathValues;
          });

          this.updateCellValidity();
          this.sortAndFilterPaths();

          const pathsWithoutScores = this.paths.filter(path =>
            !path.areaScores || Object.keys(path.areaScores).length === 0
          );

          if (pathsWithoutScores.length > 0) {
            await this.calculatePathAreaScoresCorrectly(pathsWithoutScores);
          }

          this.isLoading = false;
          this.cdr.detectChanges();
        } catch (error: any) {
          this.error = `Error al procesar datos: ${error.message || JSON.stringify(error)}`;
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        this.error = `Error al cargar datos: ${error.message || JSON.stringify(error)}`;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getEmojisForCell(path: PathValues, modeId: string): string {
    if (!path || !path.values || !Array.isArray(path.values)) return '';

    const mode = this.comparisonModes.find(m => m.id === modeId);
    if (!mode) return '';

    const emoji = this.modeEmojiMap.get(modeId) || mode.symbol || '⭐';
    const areaScore = path.areaScores?.[mode.comparison_area] || 0;

    return areaScore > 0 ? emoji.repeat(areaScore) : '';
  }

  async calculatePathAreaScoresCorrectly(pathsToCalculate: PathValues[]): Promise<void> {
    if (!pathsToCalculate || pathsToCalculate.length === 0) return;

    this.isCalculatingScores = true;

    try {
      const calculationPromises = pathsToCalculate.map(path => {
        const getOptionIdsFromDescriptions = async (descriptions: string[]): Promise<string[]> => {
          if (!descriptions || descriptions.length === 0) return [];

          const descToIdMap = new Map<string, string>();
          this.opciones.forEach(option => {
            descToIdMap.set(option.descripcion.trim(), option.id);
          });

          return descriptions.map(desc => {
            const trimmedDesc = desc.trim();
            return descToIdMap.get(trimmedDesc) || '';
          }).filter(id => id !== '');
        };

        return getOptionIdsFromDescriptions(path.descriptions || path.path)
          .then(optionIds => {
            return this.calcularPuntajesPorArea(this.projectId, path.id, path.hexa, optionIds);
          });
      });

      const results = await Promise.all(calculationPromises);

      results.forEach((scores, index) => {
        const pathId = pathsToCalculate[index].id;
        const pathIndex = this.paths.findIndex(p => p.id === pathId);

        if (pathIndex !== -1) {
          if (!this.paths[pathIndex].areaScores) {
            this.paths[pathIndex].areaScores = {};
          }

          for (const areaId in scores) {
            const mode = this.comparisonModes.find(m => m.id === areaId);
            if (mode) {
              this.paths[pathIndex].areaScores![mode.comparison_area] = scores[areaId];
            }
          }
        }
      });

      this.isCalculatingScores = false;
      this.sortAndFilterPaths(); // Reordenar después de calcular
      this.cdr.detectChanges();
    } catch (error) {
      this.isCalculatingScores = false;
      this.cdr.detectChanges();
      throw error;
    }
  }

  async calcularPuntajesPorArea(projectId: string, pathId: string, hexCode: string, optionIds: string[]): Promise<{[areaId: string]: number}> {
    try {
      const areaScores: {[areaId: string]: number} = {};

      this.comparisonModes.forEach(mode => {
        areaScores[mode.id] = 0;
      });

      const optionCells = this.allCells.filter(cell =>
        optionIds.includes(cell.opcion_id)
      );

      optionCells.forEach(cell => {
        const modeId = cell.mode_id;
        if (modeId in areaScores) {
          areaScores[modeId] += Number(cell.value);
        }
      });

      const { data: decisionAreas, error: areasError } = await supabase
        .from('decision_areas')
        .select('id, rotulo')
        .eq('project_id', projectId);

      if (areasError) throw areasError;

      const pathAreaScores: PathAreaScore[] = [];

      for (const modeId in areaScores) {
        const mode = this.comparisonModes.find(m => m.id === modeId);
        if (!mode) continue;

        const matchingArea = decisionAreas.find(area =>
          area.rotulo === mode.comparison_area ||
          area.rotulo.includes(mode.comparison_area) ||
          mode.comparison_area.includes(area.rotulo)
        );

        if (!matchingArea) continue;

        pathAreaScores.push({
          project_id: projectId,
          path_id: pathId,
          decision_area_id: matchingArea.id,
          area_rotulo: mode.comparison_area,
          score: areaScores[modeId]
        });
      }

      await supabase
        .from('path_area_scores')
        .delete()
        .eq('path_id', pathId)
        .eq('project_id', projectId);

      if (pathAreaScores.length > 0) {
        const { data: insertedData, error: insertError } = await supabase
          .from('path_area_scores')
          .insert(pathAreaScores)
          .select();

        if (insertError) throw insertError;
      }

      return areaScores;
    } catch (error) {
      return {};
    }
  }

  getPathAreaScore(path: PathValues, areaRotulo: string): number {
    if (!path.areaScores) return 0;
    return path.areaScores[areaRotulo] || 0;
  }

  getTotalScore(path: PathValues): number {
    if (!path.areaScores) return 0;
    return Object.values(path.areaScores).reduce((sum, score) => sum + score, 0);
  }

  updateCellValidity(): void {
    if (!this.paths || !Array.isArray(this.paths)) return;

    this.paths.forEach(path => {
      if (!path || !path.values || !Array.isArray(path.values)) return;

      path.values.forEach(value => {
        if (!value || !value.area) return;
        value.isValid = value.minScore === null || value.value >= value.minScore;
      });
    });
  }

  isValidCell(path: PathValues, modeId: string): boolean {
    if (!path || !path.values || !Array.isArray(path.values)) return false;

    const valueObj = path.values.find(v => v && v.area === modeId);
    if (!valueObj) return false;

    return valueObj.minScore === null || valueObj.value >= valueObj.minScore;
  }

  // Nueva función para ordenar y filtrar paths
  sortAndFilterPaths(): void {
    if (!this.paths) return;

    // Primero aplicar filtros de puntuación
    let filtered = this.paths;

    if (this.minScore !== null || this.maxScore !== null) {
      filtered = this.paths.filter(path => {
        const totalScore = this.getTotalScore(path);

        if (this.minScore !== null && totalScore < this.minScore) {
          return false;
        }

        if (this.maxScore !== null && totalScore > this.maxScore) {
          return false;
        }

        return true;
      });
    }

    // Luego ordenar de mayor a menor por sumatoria total
    this.filteredPaths = filtered.sort((a, b) => {
      const scoreA = this.getTotalScore(a);
      const scoreB = this.getTotalScore(b);
      return scoreB - scoreA; // Orden descendente (mayor a menor)
    });

    this.cdr.detectChanges();
  }

  onScoreRangeChange(range: {min: number | null, max: number | null}): void {
    this.minScore = range.min;
    this.maxScore = range.max;
    this.sortAndFilterPaths();
  }

  getValidAlternativesCount(): number {
    return this.filteredPaths.length;
  }

  getInvalidAlternativesCount(): number {
    return this.paths.length - this.filteredPaths.length;
  }

  openPathModal(path: PathValues): void {
    this.isLoading = true;

    if (path.descriptions && path.descriptions.length > 0) {
      this.selectedPath = {
        hexa: path.hexa,
        path: path.descriptions
      };
      this.isModalOpen = true;
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    from(this.pathDescriptionsService.getPathDescription(this.projectId, path.hexa))
      .pipe(
        catchError(error => {
          return of(null);
        })
      )
      .subscribe(descriptions => {
        if (descriptions && descriptions.length > 0) {
          const pathIndex = this.paths.findIndex(p => p.hexa === path.hexa);
          if (pathIndex !== -1) {
            this.paths[pathIndex].descriptions = descriptions;
          }

          this.selectedPath = {
            hexa: path.hexa,
            path: descriptions
          };
        } else {
          const generatedDescriptions = this.generatePathDescriptions(path);

          this.pathDescriptionsService.savePathDescription(this.projectId, path.hexa, generatedDescriptions)
            .then(() => {
              const pathIndex = this.paths.findIndex(p => p.hexa === path.hexa);
              if (pathIndex !== -1) {
                this.paths[pathIndex].descriptions = generatedDescriptions;
              }
              this.selectedPath = {
                hexa: path.hexa,
                path: generatedDescriptions
              };
            })
            .catch(error => {
              // Error silencioso
            });
        }

        this.isModalOpen = true;
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedPath = null;
    this.cdr.detectChanges();
  }

  generatePathDescriptions(path: PathValues): string[] {
    return path.path.map(optionId => {
      if (!optionId || optionId === "NaN" || optionId === "undefined") {
        return "[Opción no especificada]";
      }

      let opcion = this.optionIdMap.get(optionId);

      if (!opcion) {
        opcion = this.opciones.find(op =>
          op.id.startsWith(optionId) || optionId.startsWith(op.id)
        );
      }

      if (!opcion) {
        opcion = this.opciones.find(op =>
          op.id.includes(optionId) || optionId.includes(op.id)
        );
      }

      return opcion ? opcion.descripcion : `[${optionId || "Desconocido"}]`;
    });
  }

  trackByFn(index: number, item: any): number {
    return index;
  }
}
