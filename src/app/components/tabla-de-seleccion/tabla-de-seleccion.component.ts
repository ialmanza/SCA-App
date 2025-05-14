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
import { supabase } from '../../config/supabase.config';

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
}

@Component({
  selector: 'app-tabla-de-seleccion',
  standalone: true,
  imports: [CommonModule, PathModalComponent],
  providers: [OpcionesService, ComparisonModeService, ComparisonCellService, SelectedPathsService, PathDescriptionsService],
  templateUrl: './tabla-de-seleccion.component.html',
  styleUrl: './tabla-de-seleccion.component.css'
})
export class TablaDeSeleccionComponent implements OnInit, OnChanges {
  opciones$: Observable<Opcion[]>;
  comparisonModes$: Observable<ComparisonMode[]>;
  cellStates: Map<string, CellState> = new Map();
  opciones: Opcion[] = [];
  paths: PathValues[] = [];
  comparisonModes: ComparisonMode[] = [];
  validOptionsMap: Map<string, Set<string>> = new Map();
  selectedPath: { hexa: string; path: string[] } | null = null;
  isModalOpen: boolean = false;
  optionIdMap: Map<string, Opcion> = new Map();

  @Input() projectId: string = '';
  isLoading: boolean = false;
  error: string | null = null;

  constructor(
    private opcionService: OpcionesService,
    private comparisonModeService: ComparisonModeService,
    private comparisonCellService: ComparisonCellService,
    private cdr: ChangeDetectorRef,
    private selectedPathsService: SelectedPathsService,
    private pathDescriptionsService: PathDescriptionsService // Nuevo servicio inyectado
  ) {
    this.opciones$ = of([]);
    this.comparisonModes$ = of([]);
  }

  ngOnInit(): void {
    if (this.projectId && this.projectId.trim() !== '') {
      this.loadData();
    } else {
      console.warn('No se ha proporcionado un projectId válido');
      this.error = 'No se ha proporcionado un ID de proyecto válido';
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectId'] && changes['projectId'].currentValue &&
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

    console.log('Cargando datos para el proyecto:', this.projectId);
    this.isLoading = true;
    this.error = null;

    this.opciones$ = from(this.opcionService.getOpcionesByProject(this.projectId))
      .pipe(
        catchError(err => {
          console.error('Error al cargar opciones:', err);
          this.error = `Error al cargar opciones: ${err.message || JSON.stringify(err)}`;
          this.isLoading = false;
          return of([]);
        })
      );

    this.comparisonModes$ = from(this.comparisonModeService.getComparisonModesByProject(this.projectId))
      .pipe(
        map((modes: ComparisonMode[]) => modes.sort((a, b) => Number(a.order_num) - Number(b.order_num))),
        catchError(err => {
          console.error('Error al cargar modos de comparación:', err);
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
          console.error('Error al cargar paths:', err);
          this.error = `Error al cargar paths: ${err.message || JSON.stringify(err)}`;
          this.isLoading = false;
          return of([]);
        })),
      modes: this.comparisonModes$,
      opciones: this.opciones$,
      validOptions: this.comparisonCellService.getCellsWithMinimumScores(this.projectId),
      cellValues: this.comparisonCellService.getComparisonCellsByProject(this.projectId)
    }).subscribe({
      next: ({ paths, modes, opciones, validOptions, cellValues }) => {
        console.log('Datos recibidos:', { paths, modes, opciones, validOptions, cellValues });

        // Guardar opciones y crear un mapa de IDs para búsqueda eficiente
        this.opciones = opciones;
        this.optionIdMap.clear();
        opciones.forEach(opcion => {
          this.optionIdMap.set(opcion.id, opcion);
        });

        // Transformar los paths al formato esperado
        this.paths = paths.map((path: PathDescription) => ({
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
          })
        }));

        this.comparisonModes = modes;
        this.validOptionsMap = validOptions;

        // Actualizar los valores de las celdas con la información de validez
        this.updateCellValidity();

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar datos:', error);
        this.error = `Error al cargar datos: ${error.message || JSON.stringify(error)}`;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Método para cargar las descripciones de los paths
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
            console.warn(`Error al cargar descripciones para el camino ${path.hexa}:`, error);
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
        console.error('Error al cargar descripciones de los caminos:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Método para generar y guardar descripciones para los paths que no tienen
  generateAndSavePathDescriptions(): void {
    const pathsWithoutDescriptions = this.paths.filter(path => !path.descriptions);

    if (pathsWithoutDescriptions.length === 0) return;

    console.log(`Generando descripciones para ${pathsWithoutDescriptions.length} caminos...`);

    pathsWithoutDescriptions.forEach(path => {
      const descriptions = this.generatePathDescriptions(path);

      this.pathDescriptionsService.savePathDescription(this.projectId, path.hexa, descriptions)
        .then(() => {
          console.log(`Descripciones guardadas para el camino ${path.hexa}`);
          const pathIndex = this.paths.findIndex(p => p.hexa === path.hexa);
          if (pathIndex !== -1) {
            this.paths[pathIndex].descriptions = descriptions;
          }
          this.cdr.detectChanges();
        })
        .catch(error => {
          console.error(`Error al guardar descripciones para el camino ${path.hexa}:`, error);
        });
    });
  }

  // Método para generar las descripciones de un path basado en las opciones
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

      if (!opcion) {
        console.warn(`No se encontró opción para ID: ${optionId}`);
      }

      return opcion ? opcion.descripcion : `[${optionId || "Desconocido"}]`;
    });
  }

  updateCellValidity(): void {
    if (!this.paths || !Array.isArray(this.paths)) {
      console.warn('No hay paths disponibles o no es un array');
      return;
    }

    this.paths.forEach(path => {
      if (!path || !path.values || !Array.isArray(path.values)) {
        console.warn('Path inválido o sin valores:', path);
        return;
      }

      path.values.forEach(value => {
        if (!value || !value.area) {
          console.warn('Valor inválido en path:', value);
          return;
        }

        value.isValid = value.minScore === null || value.value >= value.minScore;
      });
    });
  }

  getSymbolsForCell(path: PathValues, modeId: string): string {
    if (!path || !path.values || !Array.isArray(path.values)) return '';

    const valueObj = path.values.find(v => v && v.area === modeId);
    if (!valueObj) return '';

    if (valueObj.value > 0 && valueObj.isValid) {
      return valueObj.symbol.repeat(valueObj.value);
    }

    return '';
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
          console.error(`Error al cargar descripciones para ${path.hexa}:`, error);
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
            .catch(error => console.error(`Error al guardar descripciones para ${path.hexa}:`, error));
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
}
