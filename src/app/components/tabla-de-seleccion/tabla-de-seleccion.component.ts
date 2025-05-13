import { Component, OnInit, ChangeDetectorRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { forkJoin, Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ComparisonMode } from '../../models/comparacion';
import { Opcion } from '../../models/interfaces';
import { OpcionesService } from '../../services/supabaseServices/opciones.service';
import { CommonModule } from '@angular/common';
import { ComparisonModeService } from '../../services/supabaseServices/comparison-mode.service';
import { SelectedPathsService } from '../../services/supabaseServices/selected-paths.service';
import { ComparisonCellService } from '../../services/supabaseServices/comparison-cell.service';

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
  imports: [CommonModule],
  providers: [OpcionesService, ComparisonModeService, ComparisonCellService, SelectedPathsService],
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

  @Input() projectId: string = '';
  isLoading: boolean = false;
  error: string | null = null;

  constructor(
    private opcionService: OpcionesService,
    private comparisonModeService: ComparisonModeService,
    private cdr: ChangeDetectorRef,
    private selectedPathsService: SelectedPathsService
  ) {
    // Inicializamos las observables pero no hacemos la llamada hasta tener projectId
    this.opciones$ = of([]);
    this.comparisonModes$ = of([]);
  }

  ngOnInit(): void {
    // Solo cargamos datos si tenemos un projectId válido
    if (this.projectId && this.projectId.trim() !== '') {
      this.loadData();
    } else {
      console.warn('No se ha proporcionado un projectId válido');
      this.error = 'No se ha proporcionado un ID de proyecto válido';
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Recargar datos cuando cambie el projectId
    if (changes['projectId'] && changes['projectId'].currentValue &&
        changes['projectId'].currentValue !== changes['projectId'].previousValue) {
      this.error = null;
      this.loadData();
    }
  }

   loadData(): void {
    if (!this.projectId || this.projectId.trim() === '') {
      this.error = 'No se ha proporcionado un ID de proyecto válido';
      return;
    }

    console.log('Cargando datos para el proyecto:', this.projectId);
    this.isLoading = true;
    this.error = null;

    // Inicializamos las observables con el projectId correcto
    this.opciones$ = from(this.opcionService.getOpcionesByProject(this.projectId))
      .pipe(
        catchError(err => {
          console.error('Error al cargar opciones:', err);
          this.error = `Error al cargar opciones: ${err.message || JSON.stringify(err)}`;
          return of([]);
        })
      );

    this.comparisonModes$ = from(this.comparisonModeService.getComparisonModesByProject(this.projectId))
      .pipe(
        map((modes: ComparisonMode[]) => modes.sort((a, b) => Number(a.order_num) - Number(b.order_num))),
        catchError(err => {
          console.error('Error al cargar modos de comparación:', err);
          this.error = `Error al cargar modos de comparación: ${err.message || JSON.stringify(err)}`;
          return of([]);
        })
      );

    forkJoin({
      paths: from(this.selectedPathsService.getPathsFromBackend(this.projectId))
        .pipe(catchError(err => {
          console.error('Error al cargar paths:', err);
          this.error = `Error al cargar paths: ${err.message || JSON.stringify(err)}`;
          return of([]);
        })),
      modes: this.comparisonModes$,
      opciones: this.opciones$
    }).subscribe({
      next: ({ paths, modes, opciones }) => {
        this.paths = paths;
        this.comparisonModes = modes;
        this.opciones = opciones;
        this.isLoading = false;
        this.cdr.detectChanges();
        console.log('Datos cargados correctamente:', {
          pathsCount: paths.length,
          modesCount: modes.length,
          opcionesCount: opciones.length
        });
      },
      error: (error) => {
        console.error('Error al cargar datos:', error);
        this.error = `Error al cargar datos: ${error.message || JSON.stringify(error)}`;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getSymbolsForCell(path: PathValues, modeId: number): string {
    if (!path || !path.values) return '';

    const valueObj = path.values.find(v => v && v.area === modeId);
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
