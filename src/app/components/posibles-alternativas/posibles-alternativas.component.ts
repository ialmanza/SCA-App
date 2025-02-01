import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Decision } from '../../models/decision';
import { Opcion } from '../../models/opcion';
import {DecisionesDBService} from '../../services/_Decisiones/decisiones-db.service';
import {OpcionesDBService} from '../../services/_Opciones/opciones-db.service';
import { SelectedPathsService } from '../../services/selected-path.service';
import { BehaviorSubject, firstValueFrom, forkJoin } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';

interface DecisionNode {
  areaTitle: string;
  options: {
    selected: boolean;
    text: string;
    id: string;
    hexCode?: string;
    children?: DecisionNode[];
    isLastChild?: boolean;
    isLastArea?: boolean;
    path?: string[];
  }[];
}

@Component({
  selector: 'app-posibles-alternativas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [SelectedPathsService, DecisionesDBService, OpcionesDBService],
  templateUrl: './posibles-alternativas.component.html',
  styleUrls: ['./posibles-alternativas.component.css'],
})
export class PosiblesAlternativasComponent implements OnInit {
  decisions: Decision[] = [];
  opciones: Opcion[] = [];
  decisionTree: DecisionNode[] = [];
  private uniqueAreasSubject = new BehaviorSubject<string[]>([]);
  uniqueAreas$ = this.uniqueAreasSubject.asObservable();
  paths: any[] = [];
  contador: number = 0;
  updatingOptions: { [key: string]: boolean } = {};
  isLoading: boolean = true;

  constructor(
    private opcionService: OpcionesDBService,
    private selectedPathsService: SelectedPathsService,
    private decisionService: DecisionesDBService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  // ngOnInit(): void {
  //   // Cargar las áreas importantes una sola vez al inicio
  //   this.decisionService.getImportantStatus().subscribe(
  //     importantAreas => {
  //       if (importantAreas.length === 0) {
  //         console.warn('No hay áreas importantes');
  //         return;
  //       }
  //       const areas = importantAreas.map(area => area.area);
  //       this.uniqueAreasSubject.next(areas);
  //       this.loadDecisionsAndOptions();
  //     },
  //     error => {
  //       console.error('Error al cargar áreas importantes:', error);
  //     }
  //   );
  //   this.loadExistingPaths();
  // }

  async ngOnInit(): Promise<void> {
    try {
      // Esperar por las áreas importantes
      const importantAreas = await firstValueFrom(this.decisionService.getImportantStatus());

      if (importantAreas.length === 0) {
        console.warn('No hay áreas importantes');
        return;
      }

      const areas = importantAreas.map(area => area.area);
      this.uniqueAreasSubject.next(areas);

      // Esperar a que se carguen las decisiones y opciones
      await this.loadDecisionsAndOptions();

      // Esperar a que se carguen los paths existentes
      await this.loadExistingPaths();

      this.isLoading = false;
      this.changeDetectorRef.detectChanges();
    } catch (error) {
      console.error('Error en la inicialización:', error);
      this.isLoading = false;
    }
  }

  async loadDecisionsAndOptions(): Promise<void> {
    const areas = this.getUniqueAreas();
    if (areas.length === 0) return;

    try {
      const { decisions, opciones } = await firstValueFrom(forkJoin({
        decisions: this.decisionService.getItems(),
        opciones: this.opcionService.getItems()
      }));

      this.decisions = decisions;
      this.opciones = opciones;
      this.buildDecisionTree();
    } catch (error) {
      console.error('Error al cargar datos:', error);
      throw error;
    }
  }

  async loadExistingPaths(): Promise<void> {
    try {
      const paths = await firstValueFrom(this.selectedPathsService.getPathsFromBackend());
      console.log('Paths obtenidos:', paths);
      this.paths = paths;
      this.updateTreeSelections();
    } catch (error) {
      console.error('Error obteniendo paths:', error);
      throw error;
    }
  }

  updateTreeSelections(): void {
    if (!this.paths || !this.decisionTree) return;

    const updateNode = (node: DecisionNode) => {
      node.options.forEach(option => {
        // Buscar si existe un path que coincida con el hexCode de la opción
        const matchingPath = this.paths.find(p => p.hexa === option.hexCode);
        option.selected = !!matchingPath;

        if (option.children) {
          option.children.forEach(childNode => updateNode(childNode));
        }
      });
    };

    this.decisionTree.forEach(node => updateNode(node));
    this.changeDetectorRef.detectChanges();
  }


  // Método getter para obtener las áreas únicas
  getUniqueAreas(): string[] {
    return this.uniqueAreasSubject.getValue();
  }

  // loadExistingPaths(): void {
  //   this.selectedPathsService.getPathsFromBackend().subscribe(
  //     paths => {
  //       console.log('Paths obtenidos:', paths);
  //       this.paths = paths;
  //       this.updateTreeSelections();
  //     },
  //     error => {
  //       console.error('Error obteniendo paths:', error);
  //     }
  //   );
  // }



  // updateTreeSelections(): void {
  //   // Recorre el árbol y actualiza las selecciones basadas en los paths existentes
  //   const updateNode = (node: DecisionNode, paths: any[]) => {
  //     node.options.forEach(option => {
  //       const matchingPath = this.paths.find(p => p.hexCode === option.hexCode);
  //       if (matchingPath) {
  //         option.selected = true;
  //       }
  //       if (option.children) {
  //         option.children.forEach(child => updateNode(child, paths));
  //       }
  //     });
  //   };

  //   this.decisionTree.forEach(node => updateNode(node, this.paths));
  //   this.changeDetectorRef.detectChanges();
  // }

  // updateTreeSelections(): void {
  //   const updateNode = (node: DecisionNode) => {
  //     node.options.forEach(option => {
  //       // Buscar si existe un path que coincida con el hexCode de la opción
  //       const matchingPath = this.paths.find(p => p.hexa === option.hexCode);
  //       if (matchingPath) {
  //         option.selected = true;
  //       }

  //       // Recursivamente actualizar los hijos si existen
  //       if (option.children) {
  //         option.children.forEach(childNode => updateNode(childNode));
  //       }
  //     });
  //   };

  //   // Actualizar todo el árbol
  //   this.decisionTree.forEach(node => updateNode(node));
  //   this.changeDetectorRef.detectChanges();
  // }


  onOptionSelected(option: any, path: string[]): void {
    const hexCode = option.hexCode;
    this.updatingOptions[hexCode] = true;

    if (option.selected) {
      const numericPaths = path.map(p => parseInt(p, 10));
      this.selectedPathsService.addPathToBackend(hexCode, numericPaths.map(String))
        .subscribe({
          next: (response) => {
            console.log('Alternativa creada exitosamente:', response);
            this.loadExistingPaths(); // Recargar los paths después de añadir
          },
          error: (error) => {
            console.error('Error creando alternativa:', error);
            option.selected = false; // Revertir la selección en caso de error
            this.changeDetectorRef.detectChanges();
          },
          complete: () => {
            delete this.updatingOptions[hexCode];
            this.changeDetectorRef.detectChanges();
          }
        });
    } else {
      this.selectedPathsService.deletePathFromBackend(option.id,hexCode)
        .subscribe({
          next: (response) => {
            console.log('Alternativa eliminada exitosamente:', response);
            this.loadExistingPaths(); // Recargar los paths después de eliminar
          },
          error: (error) => {
            console.error('Error eliminando alternativa:', error);
            option.selected = true; // Revertir la selección en caso de error
            this.changeDetectorRef.detectChanges();
          },
          complete: () => {
            delete this.updatingOptions[hexCode];
            this.changeDetectorRef.detectChanges();
          }
        });
    }
  }

  // loadDecisionsAndOptions(): void {
  //   const areas = this.getUniqueAreas();
  //   if (areas.length === 0) return;

  //   forkJoin({
  //     decisions: this.decisionService.getItems(),
  //     opciones: this.opcionService.getItems()
  //   }).subscribe(
  //     ({ decisions, opciones }) => {
  //       this.decisions = decisions;
  //       this.opciones = opciones;
  //       this.buildDecisionTree();
  //     },
  //     error => {
  //       console.error('Error al cargar datos:', error);
  //     }
  //   );
  // }

  buildDecisionTree(): void {
    const areas = this.getUniqueAreas();
    this.decisionTree = this.buildTreeRecursive(areas, 0);
  }

  buildTreeRecursive(areas: string[], currentIndex: number): DecisionNode[] {
    if (currentIndex >= areas.length) {
      return [];
    }

    const currentArea = areas[currentIndex];
    const areaDecisions = this.getDecisionsByArea(currentArea);

    if (areaDecisions.length === 0) {
      return [];
    }

    const areaOptions = this.getOpcionesPorArea(areaDecisions[0].id!.toString());
    const isLastArea = currentIndex === areas.length - 1;

    const node: DecisionNode = {
      areaTitle: currentArea,
      options: areaOptions.map((option, index) => ({
        text: option.descripcion,
        id: option.id!.toString(),
        selected: false,
        children: isLastArea
          ? undefined
          : this.buildTreeRecursive(areas, currentIndex + 1),
        isLastChild: index === areaOptions.length - 1,
        isLastArea: isLastArea,
      }))
    };

    // Genera un código único para cada opción.
    node.options.forEach(option => {
      option['hexCode'] = this.generateHexCode(option.text);
    });

    return [node];
  }

  getDecisionsByArea(area: string): Decision[] {
    return this.decisions.filter(d => d.area === area);
  }

  getOpcionesPorArea(areaId: string): Opcion[] {
    return this.opciones.filter(opcion => opcion.cod_area.toString() === areaId);
  }

  generateHexCode(text: string): string {
    let cont = this.contador;
    this.contador += 1;
    return `#${cont}`;
  }
}
