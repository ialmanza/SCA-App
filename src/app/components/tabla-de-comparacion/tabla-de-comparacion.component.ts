import { Component, OnInit } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { ComparisonMode } from '../../models/comparacion';
import { Opcion } from '../../models/opcion';
import { ComparisonModeService } from '../../services/comparision-mode.service';
import { OpcionService } from '../../services/opcion.service';
import { CommonModule } from '@angular/common';

interface CellState {
  isEditing: boolean;
  value: string;
}

@Component({
  selector: 'app-tabla-de-comparacion',
  standalone: true,
  imports: [ CommonModule ],
  templateUrl: './tabla-de-comparacion.component.html',
  styleUrl: './tabla-de-comparacion.component.css'
})
export class TablaDeComparacionComponent {
  opciones$: Observable<Opcion[]>;
  comparisonModes$: Observable<ComparisonMode[]>;
  cellStates: Map<string, CellState> = new Map();

  constructor(
    private opcionService: OpcionService,
    private comparisonModeService: ComparisonModeService
  ) {
    this.opciones$ = this.opcionService.getOpciones();
    this.comparisonModes$ = this.comparisonModeService.getComparisonModes().pipe(
      map(modes => modes.sort((a, b) => a.order - b.order))
    );
  }

  ngOnInit(): void {}

  getCellKey(opcionId: string, modeId: string): string {
    return `${opcionId}-${modeId}`;
  }

  getCellState(opcionId: string, modeId: string): CellState {
    const key = this.getCellKey(opcionId, modeId);
    if (!this.cellStates.has(key)) {
      this.cellStates.set(key, { isEditing: false, value: 'NA' });
    }
    return this.cellStates.get(key)!;
  }

  startEditing(opcionId: string, modeId: string): void {
    const cellState = this.getCellState(opcionId, modeId);
    cellState.isEditing = true;
  }

  finishEditing(opcionId: string, modeId: string, event: any): void {
    const cellState = this.getCellState(opcionId, modeId);
    cellState.isEditing = false;
    cellState.value = event.target.value || 'NA';
    // logica para el back cuando lo tenga juan
  }

  handleKeyDown(event: KeyboardEvent, opcionId: string, modeId: string): void {
    if (event.key === 'Enter') {
      this.finishEditing(opcionId, modeId, event);
    }
  }

  trackByFn(index: number, item: any): any {
    return item.id;
  }
}



