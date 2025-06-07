import { Component, OnInit, ChangeDetectorRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { forkJoin, Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ComparisonMode } from '../../models/comparacion';
import { Opcion } from '../../models/interfaces';
import { OpcionesService } from '../../services/supabaseServices/opciones.service';
import { CommonModule } from '@angular/common';
import { ComparisonModeService } from '../../services/supabaseServices/comparison-mode.service';
import { SelectedPathsService } from '../../services/supabaseServices/selected-paths.service';
import { ComparisonCellService } from '../../services/supabaseServices/comparison-cell.service';
import { PathModalComponent } from '../path-modal/path-modal.component';
import { PathDescriptionsService } from '../../services/supabaseServices/path-descriptions.service';
import { PathAreaScoreService, PathAreaScore } from '../../services/supabaseServices/path-area-score.service';
import { supabase } from '../../config/supabase.config';
import { Router } from '@angular/router';
import { ValidAlternativesService } from '../../services/valid-alternatives.service';
import { InvalidAlternativesService } from '../../services/invalid-alternatives.service';

interface CellState {
  value: number;
  opcionId: string;
  modeId: string;
  isValid: boolean;
}

interface PathDescription {
  id: string;
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
    maxScore: number | null;
    isInValidRange: boolean;
  }[];
  areaScores?: { [areaName: string]: number };
  conflictingAreas?: string[];
  hasConflicts?: boolean;
}

interface DecisionArea {
  id: string;
  rotulo: string;
  project_id: string;
}

@Component({
  selector: 'app-eleccion',
  standalone: true,
  imports: [CommonModule, PathModalComponent],
  templateUrl: './eleccion.component.html',
  styleUrls: ['./eleccion.component.css'],
})
export class EleccionComponent implements OnInit, OnChanges {
  opciones$: Observable<Opcion[]> = of([]);
  comparisonModes$: Observable<ComparisonMode[]> = of([]);
  cellStates: Map<string, CellState> = new Map();
  opciones: Opcion[] = [];
  paths: PathValues[] = [];
  comparisonModes: ComparisonMode[] = [];
  decisionAreas: DecisionArea[] = [];
  validOptionsMap: Map<string, Set<string>> = new Map();
  selectedPath: PathValues | null = null;
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
  // Nueva propiedad para mantener el total original
  totalAlternativesCount: number = 0;
  areaScoreRanges: Map<string, { min: number | null; max: number | null }> = new Map();

  loadingMessage: string = 'Cargando datos de la tabla';
  loadingSubtitle: string = 'Por favor espere mientras procesamos la información...';

  constructor(
    private opcionService: OpcionesService,
    private comparisonModeService: ComparisonModeService,
    private comparisonCellService: ComparisonCellService,
    private cdr: ChangeDetectorRef,
    private selectedPathsService: SelectedPathsService,
    private pathDescriptionsService: PathDescriptionsService,
    private pathAreaScoreService: PathAreaScoreService,
    private router: Router,
    private validAlternativesService: ValidAlternativesService,
    private invalidAlternativesService: InvalidAlternativesService
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

  onFilterChange(filterData: { areaId: string; minScore: number | null; maxScore: number | null }): void {
    this.areaScoreRanges.set(filterData.areaId, {
      min: filterData.minScore,
      max: filterData.maxScore
    });

    this.updateCellValidityWithRanges();
    this.filterPathsByAreaRanges();
    this.cdr.detectChanges();
  }

  loadData(): void {
    if (!this.projectId || this.projectId.trim() === '') {
      this.error = 'No se ha proporcionado un ID de proyecto válido';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.opciones$ = from(this.opcionService.getOpcionesByProject(this.projectId))
      .pipe(
        catchError(err => {
          this.error = `Error al cargar opciones: ${err.message || JSON.stringify(err)}`;
          this.isLoading = false;
          return of([]);
        })
      );

    this.comparisonModes$ = from(this.comparisonModeService.getComparisonModesByProject(this.projectId))
      .pipe(
        map((modes: ComparisonMode[]) => {
          this.modeEmojiMap.clear();
          modes.forEach(mode => {
            this.modeEmojiMap.set(mode.id, mode.symbol);
            this.areaScoreRanges.set(mode.id, {
              min: mode.puntuacion_minima || null,
              max: mode.puntuacion_maxima || null
            });
          });
          return modes.sort((a, b) => Number(a.order_num) - Number(b.order_num));
        }),
        catchError(err => {
          this.error = `Error al cargar modos de comparación: ${err.message || JSON.stringify(err)}`;
          this.isLoading = false;
          return of([]);
        })
      );

    const decisionAreas$ = of([]);

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
      modes: this.comparisonModes$,
      opciones: this.opciones$,
      validOptions: this.comparisonCellService.getCellsWithMinimumScores(this.projectId),
      cellValues: this.comparisonCellService.getComparisonCellsByProject(this.projectId),
      decisionAreas: decisionAreas$,
      pathAreaScores: this.pathAreaScoreService.getProjectPathAreaScores(this.projectId)
    }).subscribe({
      next: ({ paths, modes, opciones, validOptions, cellValues, decisionAreas, pathAreaScores }) => {
        this.allCells = cellValues;
        this.opciones = opciones;
        this.optionIdMap.clear();
        opciones.forEach(opcion => {
          this.optionIdMap.set(opcion.id, opcion);
        });

        this.decisionAreas = decisionAreas;
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
                maxScore: mode.puntuacion_maxima || null,
                isValid: false,
                isInValidRange: false
              };
            }),
            areaScores: {},
            conflictingAreas: [],
            hasConflicts: false
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

        // Guardar el total original de alternativas
        this.totalAlternativesCount = this.paths.length;
        this.filteredPaths = [...this.paths];
        this.validOptionsMap = validOptions;

        this.updateCellValidityWithRanges();

        this.cdr.detectChanges();

        const pathsWithoutScores = this.paths.filter(path =>
          !path.areaScores || Object.keys(path.areaScores).length === 0
        );

        if (pathsWithoutScores.length > 0) {
          this.calculatePathAreaScoresCorrectly(pathsWithoutScores);
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.error = `Error al cargar datos: ${error.message || JSON.stringify(error)}`;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateCellValidityWithRanges(): void {
    if (!this.paths || !Array.isArray(this.paths)) return;

    this.paths.forEach(path => {
      if (!path || !path.values || !Array.isArray(path.values)) return;

      path.conflictingAreas = [];
      path.hasConflicts = false;

      path.values.forEach(value => {
        if (!value || !value.area) return;

        const areaRange = this.areaScoreRanges.get(value.area);
        const areaScore = path.areaScores?.[this.getComparisonAreaByModeId(value.area)] || 0;

        value.isValid = value.minScore === null || value.value >= value.minScore;

        let isInRange = true;
        if (areaRange) {
          if (areaRange.min !== null && areaScore < areaRange.min) {
            isInRange = false;
          }
          if (areaRange.max !== null && areaScore > areaRange.max) {
            isInRange = false;
          }
        }

        value.isInValidRange = isInRange;

        if (!isInRange) {
          const mode = this.comparisonModes.find(m => m.id === value.area);
          if (mode && !path.conflictingAreas!.includes(mode.label)) {
            path.conflictingAreas!.push(mode.label);
            path.hasConflicts = true;
          }
        }
      });
    });
  }

  getComparisonAreaByModeId(modeId: string): string {
    const mode = this.comparisonModes.find(m => m.id === modeId);
    return mode ? mode.comparison_area : '';
  }

  filterPathsByAreaRanges(): void {
    if (!this.paths) return;

    this.filteredPaths = this.paths.filter(path => {
      if (this.areaScoreRanges.size === 0) return true;

      for (const [modeId, range] of this.areaScoreRanges.entries()) {
        if (range.min === null && range.max === null) continue;

        const comparisonArea = this.getComparisonAreaByModeId(modeId);
        const areaScore = path.areaScores?.[comparisonArea] || 0;

        if (range.min !== null && areaScore < range.min) return false;
        if (range.max !== null && areaScore > range.max) return false;
      }

      return true;
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

  isValidCellRange(path: PathValues, modeId: string): boolean {
    if (!path || !path.values || !Array.isArray(path.values)) return true;

    const valueObj = path.values.find(v => v && v.area === modeId);
    if (!valueObj) return true;

    return valueObj.isInValidRange;
  }

  getConflictingAreasText(path: PathValues): string {
    if (!path || !path.conflictingAreas || path.conflictingAreas.length === 0) return '';
    return path.conflictingAreas.join(', ');
  }

  calculatePathAreaScoresCorrectly(pathsToCalculate: PathValues[]): void {
    if (!pathsToCalculate || pathsToCalculate.length === 0) return;

    this.isCalculatingScores = true;

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

    Promise.all(calculationPromises)
      .then(results => {
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

        this.updateCellValidityWithRanges();
        //this.filterPathsByAreaRanges();

        this.isCalculatingScores = false;
        this.cdr.detectChanges();
      })
      .catch(error => {
        this.isCalculatingScores = false;
        this.cdr.detectChanges();
      });
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

  getPathAreaScore(path: PathValues, areaId: string): number {
    if (!path.areaScores) return 0;
    return path.areaScores[areaId] || 0;
  }

  getTotalScore(path: PathValues): number {
    if (!path.areaScores) return 0;
    return Object.values(path.areaScores).reduce((sum, score) => sum + score, 0);
  }

  isValidCell(path: PathValues, modeId: string): boolean {
    if (!path || !path.values || !Array.isArray(path.values)) return false;

    const valueObj = path.values.find(v => v && v.area === modeId);
    if (!valueObj) return false;

    return valueObj.minScore === null || valueObj.value >= valueObj.minScore;
  }

  trackByFn(index: number, item: any): string {
    return item.id || index;
  }

  openPathModal(path: PathValues): void {
    this.isLoading = true;

    if (path.descriptions && path.descriptions.length > 0) {
      this.selectedPath = {
        ...path,
        descriptions: path.descriptions
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
            ...path,
            descriptions: descriptions
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
                ...path,
                descriptions: generatedDescriptions
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

  // Métodos actualizados para el resumen correcto
  getTotalAlternativesCount(): number {
    return this.totalAlternativesCount;
  }

  getValidAlternativesCount(): number {
    // Contar válidas de todas las alternativas originales, no solo las filtradas
    return this.paths?.filter(path => !path?.hasConflicts)?.length || 0;
  }

  getInvalidAlternativesCount(): number {
    // Contar inválidas de todas las alternativas originales, no solo las filtradas
    return this.paths?.filter(path => path?.hasConflicts)?.length || 0;
  }

  setLoadingMessage(message: string, subtitle?: string): void {
    this.loadingMessage = message;
    if (subtitle) {
      this.loadingSubtitle = subtitle;
    }
  }

  goToValidAlternatives(): void {
    const validPaths = this.filteredPaths.filter(path => !path.hasConflicts);
    this.validAlternativesService.setValidAlternatives(validPaths);
    this.router.navigate(['/valid-alternatives'], {
      queryParams: { projectId: this.projectId }
    });
  }

  navigateToInvalidAlternatives(): void {
    const invalidPaths = this.paths.filter(path => path.hasConflicts);
    this.invalidAlternativesService.setInvalidAlternatives(invalidPaths);
    this.router.navigate(['/invalid-alternatives'], {
      queryParams: { projectId: this.projectId }
    });
  }
}
