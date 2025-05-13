import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { forkJoin, Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { ComparisonMode } from '../../models/comparacion';
import { Opcion, ComparisonCell } from '../../models/interfaces';
import { CommonModule } from '@angular/common';
import { ComparacionModeService } from '../../services/_Comparacion/comparacion-mode.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import { ComparisonCellService } from '../../services/supabaseServices/comparison-cell.service';
import { NotificationService } from '../../services/_Notification/notification.service';
import { NotificationsComponent } from "../notifications/notifications.component";
import { DecisionsService } from '../../services/supabaseServices/decisions.service';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OpcionesService } from '../../services/supabaseServices/opciones.service';

interface CellState {
  value: number;
  opcionId: string;
  modeId: string;
}

@Component({
  selector: 'app-tabla-de-comparacion',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, NotificationsComponent, FormsModule],
  providers: [OpcionesService],
  templateUrl: './tabla-de-comparacion.component.html',
  styleUrl: './tabla-de-comparacion.component.css'
})
export class TablaDeComparacionComponent implements OnInit {
  faPlus = faPlus;
  faMinus = faMinus;
  comparisonModes$: Observable<ComparisonMode[]>;
  cellStates: Map<string, CellState> = new Map();
  opciones: Opcion[] = [];
  projectId: string = '';

  constructor(
    private opcionesService: OpcionesService,
    private comparisonModeService: ComparacionModeService,
    private cdr: ChangeDetectorRef,
    private comparisonCellService: ComparisonCellService,
    private notificationService: NotificationService,
    private decisionsService: DecisionsService,
    private route: ActivatedRoute
  ) {
    this.comparisonModes$ = this.comparisonModeService.getComparisonModes().pipe(
      map(modes => modes.sort((a, b) => a.order_num - b.order_num))
    );
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.projectId = params['id'];
        this.loadImportantAreas();
      }
    });
  }

  private loadImportantAreas(): void {
    this.decisionsService.getImportantStatus(this.projectId).subscribe(
      async (importantAreas) => {
        if (importantAreas && importantAreas.length > 0) {
          await this.loadOpciones();
          this.loadCellsFromBackend();
        } else {
          this.notificationService.show('No hay áreas importantes seleccionadas', 'error');
        }
      },
      (error) => {
        this.notificationService.show('Error al cargar las áreas importantes', 'error');
      }
    );
  }

  private async loadOpciones(): Promise<void> {
    try {
      this.opciones = await this.opcionesService.getOpcionesByProject(this.projectId);
      this.cdr.detectChanges();
    } catch (error) {
      this.notificationService.show('Error al cargar las opciones', 'error');
    }
  }

  trackByFn(index: number, item: any): any {
    return item.id;
  }

  private loadCellsFromBackend(): void {
    forkJoin({
      cells: from(this.comparisonCellService.getComparisonCellsByProject(this.projectId)),
      modes: this.comparisonModes$
    }).subscribe(({ cells, modes }) => {
      cells.forEach(cell => {
        const key = this.getCellKey(cell.opcion_id, cell.mode_id);
        this.cellStates.set(key, {
          value: cell.value,
          opcionId: cell.opcion_id,
          modeId: cell.mode_id
        });
      });

      modes.forEach(mode => {
        this.opciones.forEach(opcion => {
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

      this.cdr.detectChanges();
    });
  }

  private initializeCellStates(): void {
    this.comparisonModes$.subscribe(modes => {
      this.opciones.forEach(opcion => {
        modes.forEach(mode => {
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
      this.cdr.detectChanges();
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
      await this.comparisonCellService.upsertComparisonCell(opcionId, modeId, value);
    } catch (error) {
      this.notificationService.show('Error al guardar la celda', 'error');
    }
  }

  async saveAllCells(): Promise<void> {
    try {
      const cellsToSave = Array.from(this.cellStates.values()).map(state => ({
        opcion_id: state.opcionId,
        mode_id: state.modeId,
        value: state.value,
        project_id: this.projectId
      }));

      for (const cell of cellsToSave) {
        await this.comparisonCellService.upsertComparisonCell(cell.opcion_id, cell.mode_id, cell.value);
      }
      this.notificationService.show('Todas las celdas guardadas exitosamente', 'success');
    } catch (error) {
      this.notificationService.show('Error al guardar las celdas', 'error');
    }
  }

  hasUnsavedChanges(): boolean {
    return Array.from(this.cellStates.values()).some(state => state.value !== 0);
  }

  resetTable(): void {
    this.cellStates.clear();
    this.initializeCellStates();
    this.cdr.detectChanges();
  }
}
