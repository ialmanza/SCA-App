import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ComparisonMode } from '../../models/comparacion';
import { Opcion } from '../../models/opcion';
import { OpcionesDBService } from '../../services/_Opciones/opciones-db.service';
import { CommonModule } from '@angular/common';
import { ComparacionModeService } from '../../services/_Comparacion/comparacion-mode.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import { ComparisonCellService } from '../../services/_ComparisonCell/comparison-cell.service';
import { ComparisonCell } from '../../models/comparison-cell';
import { NotificationService } from '../../services/_Notification/notification.service';
import { NotificationsComponent } from "../notifications/notifications.component";

interface CellState {
  value: number;
  opcionId: number;
  modeId: string;
}

@Component({
  selector: 'app-tabla-de-comparacion',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, NotificationsComponent],
  providers: [OpcionesDBService],
  templateUrl: './tabla-de-comparacion.component.html',
  styleUrl: './tabla-de-comparacion.component.css'
})
export class TablaDeComparacionComponent implements OnInit {
  faPlus = faPlus;
  faMinus = faMinus;
  opciones$: Observable<Opcion[]>;
  comparisonModes$: Observable<ComparisonMode[]>;
  cellStates: Map<string, CellState> = new Map();
  opciones: Opcion[] = [];

  constructor(
    private opcionService: OpcionesDBService,
    private comparisonModeService: ComparacionModeService,
    private cdr: ChangeDetectorRef,
    private comparisonCellService: ComparisonCellService,
    private notificationService: NotificationService,
  ) {
    this.opciones$ = this.opcionService.getItems();
    this.comparisonModes$ = this.comparisonModeService.getComparisonModes().pipe(
      map(modes => modes.sort((a, b) => a.order - b.order))
    );

    this.opciones$.subscribe(opciones => {
      this.opciones = opciones;
    });
  }

  ngOnInit(): void {
    this.loadCellsFromBackend();
  }

  trackByFn(index: number, item: any): any {
    return item.id;
  }

  private loadCellsFromBackend(): void {
    forkJoin({
      cells: this.comparisonCellService.getCells(),
      opciones: this.opciones$,
      modes: this.comparisonModes$
    }).subscribe(({ cells, opciones, modes }) => {
      cells.forEach(cell => {
        const key = this.getCellKey(cell.opcionId, cell.modeId);
        this.cellStates.set(key, {
          value: cell.value,
          opcionId: cell.opcionId,
          modeId: cell.modeId
        });
      });

      opciones.forEach(opcion => {
        modes.forEach(mode => {
          const key = this.getCellKey(opcion.id!, mode.id);
          if (!this.cellStates.has(key)) {
            this.cellStates.set(key, {
              value: 0,
              opcionId: opcion.id!,
              modeId: mode.id
            });
          }
        });
      });

      this.cdr.detectChanges();
    });
  }

  private initializeCellStates(): void {
    this.opciones$.subscribe(opciones => {
      this.comparisonModes$.subscribe(modes => {
        opciones.forEach(opcion => {
          modes.forEach(mode => {
            const key = this.getCellKey(opcion.id!, mode.id);
            if (!this.cellStates.has(key)) {
              this.cellStates.set(key, {
                value: 0,
                opcionId: opcion.id!,
                modeId: mode.id
              });
            }
          });
        });
        this.cdr.detectChanges();
      });
    });
  }

  getCellKey(opcionId: number, modeId: string): string {
    return `${opcionId}_${modeId}`;
  }

  getCellValue(opcionId: number, modeId: string): number {
    const key = this.getCellKey(opcionId, modeId);
    return this.cellStates.get(key)?.value || 0;
  }

  increment(opcionId: number, modeId: string, event: Event): void {
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
      this.cdr.detectChanges();
    }
  }

  decrement(opcionId: number, modeId: string, event: Event): void {
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
      this.cdr.detectChanges();
    }
  }

  saveAllCells(): void {
    const cellsToSave: ComparisonCell[] = Array.from(this.cellStates.values()).map(state => ({
      opcionId: state.opcionId,
      modeId: state.modeId,
      value: state.value
    }));

    this.comparisonCellService.createCells(cellsToSave).subscribe(
      savedCells => {
        this.notificationService.show('Todas las celdas guardadas exitosamente', 'success');
      },
      error => {
        this.notificationService.show('Error al guardar las celdas', 'error');
      }
    );
  }

  editAllCells(): void {
    const cellsToSave: ComparisonCell[] = Array.from(this.cellStates.values()).map(state => ({
      opcionId: state.opcionId,
      modeId: state.modeId,
      value: state.value
    }));

    this.comparisonCellService.updateCells(cellsToSave).subscribe(
      savedCells => {
        this.notificationService.show('Todas las celdas actualizadas exitosamente', 'success');
      },
      error => {
        this.notificationService.show('Error al actualizar las celdas', 'error');
      }
    );
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
