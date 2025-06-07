import { Component, OnInit, ChangeDetectorRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { forkJoin, Observable, from, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
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
import { RangoPuntuacionesComponent } from '../rango-puntuaciones/rango-puntuaciones.component';


interface CellState {
  value: number;
  opcionId: string;
  modeId: string;
  isValid: boolean;
}

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

interface DecisionArea {
  id: string;
  rotulo: string;
  project_id: string;
}

@Component({
  selector: 'app-tabla-de-seleccion',
  standalone: true,
  imports: [CommonModule, PathModalComponent, RangoPuntuacionesComponent],
  providers: [
    OpcionesService,
    ComparisonModeService,
    ComparisonCellService,
    SelectedPathsService,
    PathDescriptionsService,
    PathAreaScoreService
  ],
  templateUrl: './tabla-de-seleccion.component.html',
  styleUrl: './tabla-de-seleccion.component.css'
})
export class TablaDeSeleccionComponent implements OnInit, OnChanges {
  opciones$: Observable<Opcion[]> = of([]);
  comparisonModes$: Observable<ComparisonMode[]> = of([]);
  cellStates: Map<string, CellState> = new Map();
  opciones: Opcion[] = [];
  paths: PathValues[] = [];
  comparisonModes: ComparisonMode[] = [];
  decisionAreas: DecisionArea[] = [];
  validOptionsMap: Map<string, Set<string>> = new Map();
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
  valorFilteredPaths: PathValues[] = [];

  loadingMessage: string = 'Cargando datos de la tabla';
  loadingSubtitle: string = 'Por favor espere mientras procesamos la información...';

  constructor(
    private opcionService: OpcionesService,
    private comparisonModeService: ComparisonModeService,
    private comparisonCellService: ComparisonCellService,
    private cdr: ChangeDetectorRef,
    private selectedPathsService: SelectedPathsService,
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
          });
          return modes.sort((a, b) => Number(a.order_num) - Number(b.order_num));
        }),
        catchError(err => {
          this.error = `Error al cargar modos de comparación: ${err.message || JSON.stringify(err)}`;
          this.isLoading = false;
          return of([]);
        })
      );

    const decisionAreas$ = of([]);  // Ya no necesitamos cargar áreas de decisión

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
        // Guardar todas las celdas de comparación
        this.allCells = cellValues;

        // Guardar opciones y crear un mapa de IDs para búsqueda eficiente
        this.opciones = opciones;
        this.optionIdMap.clear();
        opciones.forEach(opcion => {
          this.optionIdMap.set(opcion.id, opcion);
        });

        this.decisionAreas = decisionAreas;
        this.pathAreaScores = pathAreaScores;
        this.comparisonModes = modes;

        // Transformar los paths al formato esperado
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

          // Añadir los puntajes por área a este path si existen
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

        // Inicializar los paths filtrados con todos los paths
        this.filteredPaths = [...this.paths];

        this.valorFilteredPaths = this.filteredPaths;

        this.validOptionsMap = validOptions;

        // Actualizar los valores de las celdas con la información de validez
        this.updateCellValidity();

        // Forzar la detección de cambios aquí
        this.cdr.detectChanges();

        // Si hay paths sin puntajes por área, calcularlos
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

  getEmojisForCell(path: PathValues, modeId: string): string {
    if (!path || !path.values || !Array.isArray(path.values)) return '';

    // Encontrar el modo de comparación correspondiente
    const mode = this.comparisonModes.find(m => m.id === modeId);
    if (!mode) return '';

    // Obtener el emoji para este modo
    const emoji = this.modeEmojiMap.get(modeId) || mode.symbol || '⭐';

    // Usar el puntaje calculado del área en lugar del valor de la celda
    const areaScore = path.areaScores?.[mode.comparison_area] || 0;

    // Repetir el emoji según el valor calculado del área
    return areaScore > 0 ? emoji.repeat(areaScore) : '';
  }

  getSymbolsForCell(path: PathValues, modeId: string): string {
    return this.getEmojisForCell(path, modeId);
  }

  calculatePathAreaScoresCorrectly(pathsToCalculate: PathValues[]): void {
    if (!pathsToCalculate || pathsToCalculate.length === 0) return;

    this.isCalculatingScores = true;

    // Para cada camino, necesitamos:
    // 1. Convertir las descripciones de opciones a IDs de opciones
    // 2. Para cada opción, buscar sus celdas de comparación
    // 3. Agrupar y sumar valores por área de comparación

    const calculationPromises = pathsToCalculate.map(path => {
      // Necesitamos resolver las descripciones de opciones a IDs reales
      const getOptionIdsFromDescriptions = async (descriptions: string[]): Promise<string[]> => {
        if (!descriptions || descriptions.length === 0) return [];

        // Crear un mapa de descripciones a IDs
        const descToIdMap = new Map<string, string>();
        this.opciones.forEach(option => {
          descToIdMap.set(option.descripcion.trim(), option.id);
        });

        // Mapear cada descripción a su ID correspondiente
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
        // Actualizar los puntajes en el modelo local
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
        this.cdr.detectChanges();
      })
      .catch(error => {
        this.isCalculatingScores = false;
        this.cdr.detectChanges();
      });
  }

  async calcularPuntajesPorArea(projectId: string, pathId: string, hexCode: string, optionIds: string[]): Promise<{[areaId: string]: number}> {
    try {
      // Crear un mapa para almacenar puntajes por área
      const areaScores: {[areaId: string]: number} = {};

      // Inicializar puntajes a 0 para todas las áreas de comparación
      this.comparisonModes.forEach(mode => {
        areaScores[mode.id] = 0;
      });

      // Filtrar las celdas de comparación para las opciones de este camino
      const optionCells = this.allCells.filter(cell =>
        optionIds.includes(cell.opcion_id)
      );

      // Sumar los valores por área de comparación
      optionCells.forEach(cell => {
        const modeId = cell.mode_id;
        if (modeId in areaScores) {
          areaScores[modeId] += Number(cell.value);
        }
      });

      // Primero, necesitamos obtener las áreas de decisión del proyecto
      const { data: decisionAreas, error: areasError } = await supabase
        .from('decision_areas')
        .select('id, rotulo')
        .eq('project_id', projectId);

      if (areasError) throw areasError;

      // Preparar registros para guardar en la base de datos
      const pathAreaScores: PathAreaScore[] = [];

      for (const modeId in areaScores) {
        const mode = this.comparisonModes.find(m => m.id === modeId);
        if (!mode) continue;

        // Buscar el área de decisión correspondiente al área de comparación
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

      // Eliminar puntajes existentes para este camino
      await supabase
        .from('path_area_scores')
        .delete()
        .eq('path_id', pathId)
        .eq('project_id', projectId);

      // Insertar nuevos puntajes
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

  calculateAllPathScores(): void {
    if (!this.paths || this.paths.length === 0) return;
    this.isCalculatingScores = true;
    this.calculatePathAreaScoresCorrectly(this.paths);
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

  trackByFn(index: number, item: any): number {
    return index;
  }

  parseInt(id: string): number {
    return parseInt(id, 10);
  }

  findOpcionById(optionId: string): Opcion | undefined {
    if (this.optionIdMap.has(optionId)) {
      return this.optionIdMap.get(optionId);
    }

    return this.opciones.find(opcion =>
      opcion.id.startsWith(optionId) || opcion.id.includes(optionId)
    );
  }

  loadPathDescriptions(): void {
    if (!this.paths || this.paths.length === 0) {
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    // Creamos un array de promesas para las descripciones de cada path
    const descriptionPromises = this.paths.map(path =>
      from(this.pathDescriptionsService.getPathDescription(this.projectId, path.hexa))
        .pipe(
          map(descriptions => ({ hexCode: path.hexa, descriptions })),
          catchError(error => {
            return of({ hexCode: path.hexa, descriptions: null });
          })
        )
    );

    // Ejecutamos todas las promesas en paralelo
    forkJoin(descriptionPromises).subscribe({
      next: (results) => {
        results.forEach(result => {
          const pathIndex = this.paths.findIndex(p => p.hexa === result.hexCode);
          if (pathIndex !== -1 && result.descriptions) {
            this.paths[pathIndex].descriptions = result.descriptions;
          }
        });

        this.generateAndSavePathDescriptions();

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  generateAndSavePathDescriptions(): void {
    const pathsWithoutDescriptions = this.paths.filter(path => !path.descriptions);

    if (pathsWithoutDescriptions.length === 0) return;

    pathsWithoutDescriptions.forEach(path => {
      const descriptions = this.generatePathDescriptions(path);

      this.pathDescriptionsService.savePathDescription(this.projectId, path.hexa, descriptions)
        .then(() => {
          const pathIndex = this.paths.findIndex(p => p.hexa === path.hexa);
          if (pathIndex !== -1) {
            this.paths[pathIndex].descriptions = descriptions;
          }
          this.cdr.detectChanges();
        })
        .catch(error => {
          // Error silencioso
        });
    });
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

  getCellScore(path: PathValues, modeId: string): number {
    if (!path || !path.values || !Array.isArray(path.values)) return 0;

    const valueObj = path.values.find(v => v && v.area === modeId);
    if (!valueObj) return 0;

    return valueObj.value;
  }

  onScoreRangeChange(range: {min: number | null, max: number | null}): void {
    this.minScore = range.min;
    this.maxScore = range.max;
    this.filterPaths();
  }

  filterPaths(): void {
    if (!this.paths) return;

    if (this.minScore === null && this.maxScore === null) {
      // Si no hay filtros, mostrar todos los paths
      this.filteredPaths = [...this.paths];
    } else {
      this.filteredPaths = this.paths.filter(path => {
        const totalScore = this.getTotalScore(path);
        
        // Si hay una puntuación mínima y el score es menor, el path no es válido
        if (this.minScore !== null && totalScore < this.minScore) {
          return false;
        }
        
        // Si hay una puntuación máxima y el score es mayor, el path no es válido
        if (this.maxScore !== null && totalScore > this.maxScore) {
          return false;
        }
        
        return true;
      });
    }

    this.cdr.detectChanges();
  }

  getValidAlternativesCount(): number {
    return this.filteredPaths.length;
  }

  getInvalidAlternativesCount(): number {
    return this.paths.length - this.filteredPaths.length;
  }

  setLoadingMessage(message: string, subtitle?: string): void {
    this.loadingMessage = message;
    if (subtitle) {
      this.loadingSubtitle = subtitle;
    }
  }
}
