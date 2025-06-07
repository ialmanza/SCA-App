import { Component, OnInit, ChangeDetectorRef, Input } from '@angular/core';
import { forkJoin, Observable, from, of } from 'rxjs';
import { map, catchError, tap, switchMap, finalize } from 'rxjs/operators';
import { ComparisonMode } from '../../models/comparacion';
import { Opcion, ComparisonCell } from '../../models/interfaces';
import { CommonModule } from '@angular/common';
import { ComparacionModeService } from '../../services/_Comparacion/comparacion-mode.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faMinus, faSave, faUndo, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { ComparisonCellService } from '../../services/supabaseServices/comparison-cell.service';
import { NotificationService } from '../../services/_Notification/notification.service';
import { NotificationsComponent } from "../notifications/notifications.component";
import { DecisionsService } from '../../services/supabaseServices/decisions.service';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OpcionesService } from '../../services/supabaseServices/opciones.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslationService } from '../../services/translation.service';

interface CellState {
  value: number;
  opcionId: string;
  modeId: string;
}

@Component({
  selector: 'app-tabla-de-comparacion',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, NotificationsComponent, FormsModule, TranslateModule],
  providers: [OpcionesService],
  templateUrl: './tabla-de-comparacion.component.html',
  styleUrl: './tabla-de-comparacion.component.css'
})
export class TablaDeComparacionComponent implements OnInit {
  faPlus = faPlus;
  faMinus = faMinus;
  faSave = faSave;
  faUndo = faUndo;
  faExclamationCircle = faExclamationCircle;
  comparisonModes: ComparisonMode[] = [];
  comparisonModes$: Observable<ComparisonMode[]>;
  cellStates: Map<string, CellState> = new Map();
  opciones: Opcion[] = [];
  @Input() projectId: string = '';
  loading: boolean = true;
  saving: boolean = false; // Nuevo estado para el guardado
  error: string | null = null;
  loadingMessage: string = 'Cargando datos de la tabla';
  loadingSubtitle: string = 'Por favor espere mientras procesamos la información...';


  constructor(
    private opcionesService: OpcionesService,
    private comparisonModeService: ComparacionModeService,
    private cdr: ChangeDetectorRef,
    private comparisonCellService: ComparisonCellService,
    private notificationService: NotificationService,
    private decisionsService: DecisionsService,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private translationService: TranslationService
  ) {
    this.comparisonModes$ = of([]);
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.projectId = params['id'];
        console.log('ProjectID recibido:', this.projectId);
        this.inicializarDatos();
      } else {
        this.loading = false;
        this.error = 'No se recibió un ID de proyecto válido';
        console.error('No se recibió un ID de proyecto válido');
      }
    });
  }

  private inicializarDatos(): void {
    console.log('Inicializando datos...');
    from(this.comparisonModeService.getComparisonModesByProject(this.projectId)).pipe(
      tap(modes => {
        console.log('Modos de comparación cargados:', modes);
      }),
      map((modes: ComparisonMode[]) => modes.sort((a: ComparisonMode, b: ComparisonMode) => a.order_num - b.order_num)),
      catchError(error => {
        console.error('Error al cargar los modos de comparación:', error);
        this.notificationService.show('Error al cargar los modos de comparación', 'error');
        this.loading = false;
        this.error = 'Error al cargar los modos de comparación';
        return of([]);
      })
    ).subscribe(modes => {
      this.comparisonModes = modes;
      this.comparisonModes$ = of(modes);
      this.loadImportantAreas();
    });
  }

  private loadImportantAreas(): void {
    console.log('Cargando áreas importantes...');
    this.decisionsService.getImportantStatus(this.projectId).pipe(
      tap(importantAreas => {
        console.log('Áreas importantes cargadas:', importantAreas);
      }),
      catchError(error => {
        console.error('Error al cargar las áreas importantes:', error);
        this.notificationService.show('Error al cargar las áreas importantes', 'error');
        this.loading = false;
        this.error = 'Error al cargar las áreas importantes';
        return of([]);
      }),
      finalize(() => {
        if (this.loading && !this.opciones.length) {
          this.loading = false;
          this.cdr.detectChanges();
        }
      })
    ).subscribe(importantAreas => {
      if (importantAreas && importantAreas.length > 0) {
        this.loadOpciones();
      } else {
        this.loading = false;
        this.notificationService.show('No hay áreas importantes seleccionadas', 'info');
        console.warn('No hay áreas importantes seleccionadas');
        this.cdr.detectChanges();
      }
    });
  }

  private loadOpciones(): void {
    console.log('Cargando opciones...');
    from(this.opcionesService.getOpcionesByProject(this.projectId)).pipe(
      tap(opciones => {
        console.log('Opciones cargadas:', opciones);
      }),
      catchError(error => {
        console.error('Error al cargar las opciones:', error);
        this.notificationService.show('Error al cargar las opciones', 'error');
        this.loading = false;
        this.error = 'Error al cargar las opciones';
        return of([]);
      }),
      finalize(() => {
        if (this.loading && !this.comparisonModes.length) {
          this.loading = false;
          this.cdr.detectChanges();
        }
      })
    ).subscribe(opciones => {
      this.opciones = opciones;
      if (opciones.length > 0) {
        this.loadCellsFromBackend();
      } else {
        this.loading = false;
        console.warn('No hay opciones disponibles');
        this.cdr.detectChanges();
      }
    });
  }

  trackByFn(index: number, item: any): any {
    return item.id;
  }

  private loadCellsFromBackend(): void {
    console.log('Cargando celdas de comparación...');

    if (this.comparisonModes.length === 0 || this.opciones.length === 0) {
      console.warn('No hay modos de comparación o opciones para cargar celdas');
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    from(this.comparisonCellService.getComparisonCellsByProject(this.projectId)).pipe(
      tap(cells => {
        console.log('Celdas cargadas:', cells);
      }),
      catchError(error => {
        console.error('Error al cargar las celdas de comparación:', error);
        this.notificationService.show('Error al cargar los datos de la tabla', 'error');
        this.loading = false;
        this.error = 'Error al cargar los datos de la tabla';
        return of([]);
      }),
      finalize(() => {
        // Garantizar que loading sea false al finalizar
        this.loading = false;
        this.cdr.detectChanges();
        console.log('Carga finalizada. Estado de los datos:', {
          opciones: this.opciones.length,
          modos: this.comparisonModes.length,
          celdas: this.cellStates.size
        });
      })
    ).subscribe(cells => {
      // Primero inicializar todas las celdas a 0
      this.inicializarCeldasVacias();

      // Luego actualizar con los valores existentes
      cells.forEach(cell => {
        const key = this.getCellKey(cell.opcion_id, cell.mode_id);
        this.cellStates.set(key, {
          value: cell.value,
          opcionId: cell.opcion_id,
          modeId: cell.mode_id
        });
      });
    });
  }

  private inicializarCeldasVacias(): void {
    console.log('Inicializando celdas vacías...');
    this.opciones.forEach(opcion => {
      this.comparisonModes.forEach(mode => {
        const key = this.getCellKey(opcion.id, mode.id);
        if (!this.cellStates.has(key)) {
          this.cellStates.set(key, {
            value: 0,
            opcionId: opcion.id,
            modeId: mode.id
          });
        }
      });
    });
  }

  getCellKey(opcionId: string, modeId: string): string {
    return `${opcionId}_${modeId}`;
  }

  getCellValue(opcionId: string, modeId: string): number {
    const key = this.getCellKey(opcionId, modeId);
    return this.cellStates.get(key)?.value || 0;
  }

  async increment(opcionId: string, modeId: string, event: Event): Promise<void> {
    event.stopPropagation();
    const key = this.getCellKey(opcionId, modeId);
    const currentState = this.cellStates.get(key) || {
      value: 0,
      opcionId,
      modeId
    };

    if (currentState.value < 5) {
      const newValue = currentState.value + 1;
      this.cellStates.set(key, { ...currentState, value: newValue });
      await this.saveCell(opcionId, modeId, newValue);
      this.cdr.detectChanges();
    }
  }

  async decrement(opcionId: string, modeId: string, event: Event): Promise<void> {
    event.stopPropagation();
    const key = this.getCellKey(opcionId, modeId);
    const currentState = this.cellStates.get(key) || {
      value: 0,
      opcionId,
      modeId
    };

    if (currentState.value > 0) {
      const newValue = currentState.value - 1;
      this.cellStates.set(key, { ...currentState, value: newValue });
      await this.saveCell(opcionId, modeId, newValue);
      this.cdr.detectChanges();
    }
  }

  private async saveCell(opcionId: string, modeId: string, value: number): Promise<void> {
    try {
      console.log('Guardando celda:', { opcionId, modeId, value });
      await this.comparisonCellService.upsertComparisonCell(opcionId, modeId, value, this.projectId);
      this.notificationService.show('Celda guardada exitosamente', 'success');
    } catch (error) {
      console.error('Error al guardar la celda:', error);
      this.notificationService.show('Error al guardar la celda', 'error');
    }
  }

  async saveAllCells(): Promise<void> {
    this.saving = true; // Activar estado de guardado

    try {
      const cellsToSave = Array.from(this.cellStates.values()).map(state => ({
        opcion_id: state.opcionId,
        mode_id: state.modeId,
        value: state.value,
        project_id: this.projectId
      }));

      console.log('Guardando todas las celdas:', cellsToSave.length);

      for (const cell of cellsToSave) {
        await this.comparisonCellService.upsertComparisonCell(cell.opcion_id, cell.mode_id, cell.value, this.projectId);
      }

      this.notificationService.show('Todas las celdas guardadas exitosamente', 'success');
    } catch (error) {
      console.error('Error al guardar las celdas:', error);
      this.notificationService.show('Error al guardar las celdas', 'error');
    } finally {
      this.saving = false; // Desactivar estado de guardado
      this.cdr.detectChanges();
    }
  }

  hasUnsavedChanges(): boolean {
    // Verificar si hay al menos una celda con valor distinto a 0
    return Array.from(this.cellStates.values()).some(state => state.value !== 0);
  }

  resetTable(): void {
    console.log('Reiniciando tabla...');
    this.cellStates.clear();
    this.inicializarCeldasVacias();
    this.cdr.detectChanges();
  }

  setLoadingMessage(message: string, subtitle?: string): void {
    this.loadingMessage = message;
    if (subtitle) {
      this.loadingSubtitle = subtitle;
    }
  }
}
