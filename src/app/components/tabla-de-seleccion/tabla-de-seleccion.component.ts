import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ComparisonMode } from '../../models/comparacion';
import { Opcion } from '../../models/interfaces';
import { OpcionesDBService } from '../../services/_Opciones/opciones-db.service';
import { CommonModule } from '@angular/common';
import { ComparacionModeService } from '../../services/_Comparacion/comparacion-mode.service';
import { ComparisonCellService } from '../../services/_ComparisonCell/comparison-cell.service';
import { SelectedPathsService } from '../../services/selected-path.service';

interface CellState {
  value: number;
  opcionId: number;
  modeId: string;
}

interface PathValues {
  id: number;
  hexa: string;
  options: number[];
  values: {
    area: number;
    symbol: string;
    value: number;
  }[];
}

@Component({
  selector: 'app-tabla-de-seleccion',
  standalone: true,
  imports: [ CommonModule],
  providers: [OpcionesDBService, ComparacionModeService, ComparisonCellService, SelectedPathsService],
  templateUrl: './tabla-de-seleccion.component.html',
  styleUrl: './tabla-de-seleccion.component.css'
})
export class TablaDeSeleccionComponent implements OnInit {
  opciones$: Observable<Opcion[]>;
  comparisonModes$: Observable<ComparisonMode[]>;
  cellStates: Map<string, CellState> = new Map();
  opciones: Opcion[] = [];
  paths: PathValues[] = [];
  comparisonModes: ComparisonMode[] = [];

  constructor(
    private opcionService: OpcionesDBService,
    private comparisonModeService: ComparacionModeService,
    private cdr: ChangeDetectorRef,
    private selectedPathsService: SelectedPathsService
  ) {
    this.opciones$ = this.opcionService.getItems();
    this.comparisonModes$ = this.comparisonModeService.getComparisonModes().pipe(
      map(modes => modes.sort((a, b) => Number(a.order_num) - Number(b.order_num)))
    );
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    forkJoin({
      paths: this.selectedPathsService.getPathsFromBackend(),
      modes: this.comparisonModes$
    }).subscribe(({ paths, modes }) => {
      this.paths = paths;
      this.comparisonModes = modes;
      this.cdr.detectChanges();
    });
  }

  getSymbolsForCell(path: PathValues, modeId: number): string {
    const valueObj = path.values.find(v => v.area === modeId);
    if (!valueObj || valueObj.value === 0) return '';

    return valueObj.symbol.repeat(valueObj.value);
  }

  trackByFn(index: number, item: any): number {
    return index;
  }

  parseInt(id: string): number {
    return parseInt(id, 10);
  }

}
