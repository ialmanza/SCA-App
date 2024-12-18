
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ComparisonMode } from '../../models/comparacion';
import { Opcion } from '../../models/opcion';
import { OpcionesDBService } from '../../services/_Opciones/opciones-db.service';
import { CommonModule } from '@angular/common';
import { ComparacionModeService } from '../../services/_Comparacion/comparacion-mode.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';

interface CellState {
  value: number;
}

interface TableState {
  [key: string]: CellState;
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
  tableState: TableState = {};
  opciones: Opcion[] = [];

  constructor(
    private opcionService: OpcionesDBService,
    private comparisonModeService: ComparacionModeService
  ) {
    this.opciones$ = this.opcionService.getItems();
    this.comparisonModes$ = this.comparisonModeService.getComparisonModes().pipe(
      map(modes => modes.sort((a, b) => a.order - b.order))
    );
    this.opcionService.getItems().subscribe((opciones: Opcion[]) => {
      this.opciones = opciones;
    });
  }

  ngOnInit(): void {
    // Inicializar el estado si es necesario
  }

  getCellKey(opcionId: string, modeId: string): string {
    return `${opcionId}_${modeId}`;
  }

  getCellValue(opcionId: string, modeId: string): number {
    const key = this.getCellKey(opcionId, modeId);
    return this.tableState[key]?.value || 0;
  }

  increment(opcionId: string, modeId: string, event: Event): void {
    event.stopPropagation();
    const key = this.getCellKey(opcionId, modeId);

    if (!this.tableState[key]) {
      this.tableState[key] = { value: 0 };
    }

    this.tableState[key].value++;

    // Aquí puedes agregar la lógica para guardar en el backend
    console.log(`Incrementado celda ${key} a: ${this.tableState[key].value}`);
  }

  decrement(opcionId: string, modeId: string, event: Event): void {
    event.stopPropagation();
    const key = this.getCellKey(opcionId, modeId);

    if (!this.tableState[key]) {
      this.tableState[key] = { value: 0 };
    }

    this.tableState[key].value--;

    // Aquí puedes agregar la lógica para guardar en el backend
    console.log(`Decrementado celda ${key} a: ${this.tableState[key].value}`);
  }

  trackByFn(index: number, item: any): any {
    return item.id;
  }
}
