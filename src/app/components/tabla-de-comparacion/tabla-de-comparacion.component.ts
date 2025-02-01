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

interface CellState {
  value: number;
  opcionId: number;  // Cambiado a number ya que el id es numérico
  modeId: string;
}

@Component({
  selector: 'app-tabla-de-comparacion',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
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
  ) {
    this.opciones$ = this.opcionService.getItems();
    this.comparisonModes$ = this.comparisonModeService.getComparisonModes().pipe(
      map(modes => modes.sort((a, b) => a.order - b.order))
    );

    this.opciones$.subscribe(opciones => {
      console.log('Opciones recibidas:', opciones);
      this.opciones = opciones;
    });
  }

  ngOnInit(): void {
    //this.initializeCellStates();
    this.loadCellsFromBackend();
  }

  trackByFn(index: number, item: any): any {
    return item.id; // or any other unique identifier
  }

  private loadCellsFromBackend(): void {
    forkJoin({
      cells: this.comparisonCellService.getCells(),
      opciones: this.opciones$,
      modes: this.comparisonModes$
    }).subscribe(({ cells, opciones, modes }) => {
      // Inicializar el mapa de estados con los valores del backend
      cells.forEach(cell => {
        const key = this.getCellKey(cell.opcionId, cell.modeId);
        this.cellStates.set(key, {
          value: cell.value,
          opcionId: cell.opcionId,
          modeId: cell.modeId
        });
      });

      // Inicializar celdas faltantes con valor 0
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

  // increment(opcionId: number, modeId: string, event: Event): void {
  //   event.stopPropagation();
  //   console.log('Datos recibidos en increment:', {
  //     opcionId,
  //     modeId,
  //     opcionCompleta: this.opciones.find(o => o.id === opcionId)
  //   });

  //   const key = this.getCellKey(opcionId, modeId);

  //   if (!this.cellStates.has(key)) {
  //     this.cellStates.set(key, {
  //       value: 0,
  //       opcionId,
  //       modeId
  //     });
  //   }

  //   const currentState = this.cellStates.get(key)!;
  //   const newValue = currentState.value + 1;

  //   this.cellStates.set(key, {
  //     ...currentState,
  //     value: newValue
  //   });

  //   this.cdr.detectChanges();
  //   console.log(`Incrementado celda ${key} a: ${newValue}`);
  // }

  // decrement(opcionId: number, modeId: string, event: Event): void {
  //   event.stopPropagation();
  //   const key = this.getCellKey(opcionId, modeId);

  //   if (!this.cellStates.has(key)) {
  //     this.cellStates.set(key, {
  //       value: 0,
  //       opcionId,
  //       modeId
  //     });
  //   }

  //   const currentState = this.cellStates.get(key)!;
  //   const newValue = currentState.value - 1;

  //   this.cellStates.set(key, {
  //     ...currentState,
  //     value: newValue
  //   });

  //   this.cdr.detectChanges();
  //   console.log(`Decrementado celda ${key} a: ${newValue}`);
  // }

  // trackByFn(index: number, item: any): any {
  //   return item.id;
  // }

  increment(opcionId: number, modeId: string, event: Event): void {
    event.stopPropagation();
    const key = this.getCellKey(opcionId, modeId);
    const currentState = this.cellStates.get(key) || {
      value: 0,
      opcionId,
      modeId
    };

    const newValue = currentState.value + 1;
    this.cellStates.set(key, { ...currentState, value: newValue });

    this.comparisonCellService.updateCell({
      opcionId,
      modeId,
      value: newValue
    }).subscribe(
      updatedCell => {
        console.log('Celda actualizada en el backend:', updatedCell);
      },
      error => {
        console.error('Error al actualizar la celda:', error);
        // Revertir el cambio en caso de error
        this.cellStates.set(key, currentState);
        this.cdr.detectChanges();
      }
    );

    this.cdr.detectChanges();
  }

  decrement(opcionId: number, modeId: string, event: Event): void {
    event.stopPropagation();
    const key = this.getCellKey(opcionId, modeId);
    const currentState = this.cellStates.get(key) || {
      value: 0,
      opcionId,
      modeId
    };

    const newValue = currentState.value - 1;
    this.cellStates.set(key, { ...currentState, value: newValue });

    this.comparisonCellService.updateCell({
      opcionId,
      modeId,
      value: newValue
    }).subscribe(
      updatedCell => {
        console.log('Celda actualizada en el backend:', updatedCell);
      },
      error => {
        console.error('Error al actualizar la celda:', error);
        // Revertir el cambio en caso de error
        this.cellStates.set(key, currentState);
        this.cdr.detectChanges();
      }
    );

    this.cdr.detectChanges();
  }

  saveAllCells(): void {
    // Convertir el Map de estados a un array de ComparisonCell
    const cellsToSave: ComparisonCell[] = Array.from(this.cellStates.values()).map(state => ({
      opcionId: state.opcionId,
      modeId: state.modeId,
      value: state.value
    }));

    console.log('Datos a enviar:', cellsToSave);

    this.comparisonCellService.createCells(cellsToSave).subscribe(
      savedCells => {
        console.log('Todas las celdas guardadas exitosamente:', savedCells);
        // Aquí podrías mostrar un mensaje de éxito
      },
      error => {
        console.error('Error al guardar las celdas:', error);
        // Aquí podrías mostrar un mensaje de error
      }
    );
  }

  // Agregar un método para verificar si hay cambios sin guardar
  hasUnsavedChanges(): boolean {
    return Array.from(this.cellStates.values()).some(state => state.value !== 0);
  }

  // Opcional: Agregar un método para limpiar la tabla
  resetTable(): void {
    this.cellStates.clear();
    this.initializeCellStates();
    this.cdr.detectChanges();
  }
}
