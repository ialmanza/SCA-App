import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Decision } from '../../models/decision';
import { Opcion } from '../../models/interfaces';
import { OpcionesService } from '../../services/supabaseServices/opciones.service';
import { SelectedPathsService } from '../../services/supabaseServices/selected-paths.service';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { NotificationService } from '../../services/_Notification/notification.service';
import { NotificationsComponent } from "../notifications/notifications.component";
import { DecisionsService } from '../../services/supabaseServices/decisions.service';

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
  imports: [CommonModule, FormsModule, NotificationsComponent],
  providers: [SelectedPathsService, OpcionesService],
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
  @Input() projectId!: string;

  constructor(
    private opcionesService: OpcionesService,
    private selectedPathsService: SelectedPathsService,
    private decisionsService: DecisionsService,
    private changeDetectorRef: ChangeDetectorRef,
    private notificationService: NotificationService
  ) {}

  async ngOnInit(): Promise<void> {
    if (!this.projectId) {
      this.notificationService.show('ID de proyecto no encontrado', 'error');
      this.isLoading = false;
      return;
    }

    try {
      const importantAreas = await firstValueFrom(this.decisionsService.getImportantStatus(this.projectId));

      if (importantAreas.length === 0) {
        this.notificationService.show('No hay áreas importantes para este proyecto', 'info');
        this.isLoading = false;
        return;
      }

      const areas = importantAreas.map(area => area.nombre_area);
      this.uniqueAreasSubject.next(areas);

      await this.loadDecisionsAndOptions();

      await this.loadExistingPaths();

      this.isLoading = false;
      this.changeDetectorRef.detectChanges();
    } catch (error) {
      this.notificationService.show('Error en la inicialización', 'error');
      this.isLoading = false;
    }
  }

  async loadDecisionsAndOptions(): Promise<void> {
    const areas = this.getUniqueAreas();
    if (areas.length === 0) return;

    try {
      const decisions = await firstValueFrom(this.decisionsService.getDecisionsByProject(this.projectId));
      this.decisions = decisions;

      // Usar el nuevo servicio de opciones con Supabase
      const opciones = await this.opcionesService.getOpcionesByProject(this.projectId);
      this.opciones = opciones;

      this.buildDecisionTree();
    } catch (error) {
      this.notificationService.show('Error al cargar datos', 'error');
      throw error;
    }
  }

  async loadExistingPaths(): Promise<void> {
    try {
      const paths = await firstValueFrom(this.selectedPathsService.getPathsFromBackend(this.projectId));
      this.paths = paths;
      this.updateTreeSelections();
    } catch (error) {
      this.notificationService.show('Error obteniendo paths', 'error');
      throw error;
    }
  }

  updateTreeSelections(): void {
    if (!this.paths || !this.decisionTree) return;

    const updateNode = (node: DecisionNode) => {
      node.options.forEach(option => {
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

  getUniqueAreas(): string[] {
    return this.uniqueAreasSubject.getValue();
  }

  onOptionSelected(option: any, path: string[]): void {
    const hexCode = option.hexCode;
    this.updatingOptions[hexCode] = true;

    if (option.selected) {
      const numericPaths = path.map(p => parseInt(p, 10));
      this.selectedPathsService.addPathToBackend(hexCode, numericPaths.map(String), this.projectId)
        .subscribe({
          next: () => {
            this.notificationService.show('Alternativa creada exitosamente', 'success');
            this.loadExistingPaths();
          },
          error: () => {
            this.notificationService.show('Error creando alternativa', 'error');
            option.selected = false;
            this.changeDetectorRef.detectChanges();
          },
          complete: () => {
            delete this.updatingOptions[hexCode];
            this.changeDetectorRef.detectChanges();
          }
        });
    } else {
      this.selectedPathsService.deletePathFromBackend(option.id, hexCode, this.projectId)
        .subscribe({
          next: () => {
            this.notificationService.show('Alternativa eliminada exitosamente', 'success');
            this.loadExistingPaths();
          },
          error: () => {
            this.notificationService.show('Error eliminando alternativa', 'error');
            option.selected = true;
            this.changeDetectorRef.detectChanges();
          },
          complete: () => {
            delete this.updatingOptions[hexCode];
            this.changeDetectorRef.detectChanges();
          }
        });
    }
  }

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

    node.options.forEach(option => {
      option['hexCode'] = this.generateHexCode(option.text);
    });

    return [node];
  }

  getDecisionsByArea(area: string): Decision[] {
    return this.decisions.filter(d => d.nombre_area === area);
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
