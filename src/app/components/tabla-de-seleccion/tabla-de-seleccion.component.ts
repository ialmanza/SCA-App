import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ComparisonMode } from '../../models/comparacion';
import { Opcion } from '../../models/opcion';
import { OpcionesDBService } from '../../services/_Opciones/opciones-db.service';
import { CommonModule } from '@angular/common';
import { ComparacionModeService } from '../../services/_Comparacion/comparacion-mode.service';

interface CellState {
  value: number;
  opcionId: number;  // Cambiado a number ya que el id es numérico
  modeId: string;
}


@Component({
  selector: 'app-tabla-de-seleccion',
  standalone: true,
  imports: [ CommonModule],
  templateUrl: './tabla-de-seleccion.component.html',
  styleUrl: './tabla-de-seleccion.component.css'
})
export class TablaDeSeleccionComponent {
  opciones$: Observable<Opcion[]>;
  comparisonModes$: Observable<ComparisonMode[]>;
  cellStates: Map<string, CellState> = new Map();
  opciones: Opcion[] = [];

  constructor(
    private opcionService: OpcionesDBService,
    private comparisonModeService: ComparacionModeService,
    private cdr: ChangeDetectorRef
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
    this.initializeCellStates();
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
    console.log('Datos recibidos en increment:', {
      opcionId,
      modeId,
      opcionCompleta: this.opciones.find(o => o.id === opcionId)
    });

    const key = this.getCellKey(opcionId, modeId);

    if (!this.cellStates.has(key)) {
      this.cellStates.set(key, {
        value: 0,
        opcionId,
        modeId
      });
    }

    const currentState = this.cellStates.get(key)!;
    const newValue = currentState.value + 1;

    this.cellStates.set(key, {
      ...currentState,
      value: newValue
    });

    this.cdr.detectChanges();
    console.log(`Incrementado celda ${key} a: ${newValue}`);
  }

  decrement(opcionId: number, modeId: string, event: Event): void {
    event.stopPropagation();
    const key = this.getCellKey(opcionId, modeId);

    if (!this.cellStates.has(key)) {
      this.cellStates.set(key, {
        value: 0,
        opcionId,
        modeId
      });
    }

    const currentState = this.cellStates.get(key)!;
    const newValue = currentState.value - 1;

    this.cellStates.set(key, {
      ...currentState,
      value: newValue
    });

    this.cdr.detectChanges();
    console.log(`Decrementado celda ${key} a: ${newValue}`);
  }

  trackByFn(index: number, item: any): any {
    return item.id;
  }
}

