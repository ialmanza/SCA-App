import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Decision } from '../../models/decision';
import { Opcion } from '../../models/interfaces';
import { OpcionesService } from '../../services/supabaseServices/opciones.service';
import { SelectedPathsService } from '../../services/supabaseServices/selected-paths.service';
import { PathDescriptionsService } from '../../services/supabaseServices/path-descriptions.service';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { NotificationService } from '../../services/_Notification/notification.service';
import { NotificationsComponent } from "../notifications/notifications.component";
import { DecisionsService } from '../../services/supabaseServices/decisions.service';
import { supabase } from '../../config/supabase.config';

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
  providers: [SelectedPathsService, OpcionesService, PathDescriptionsService],
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
    private pathDescriptionsService: PathDescriptionsService,
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
      // Obtener todos los paths del proyecto
      const { data: paths, error } = await supabase
        .from('path_descriptions')
        .select('*')
        .eq('project_id', this.projectId);

      if (error) throw error;

      this.paths = paths || [];
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
        const matchingPath = this.paths.find(p => p.hex_code === option.hexCode);
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

  async onOptionSelected(option: any, path: string[]): Promise<void> {
    const hexCode = option.hexCode;
    this.updatingOptions[hexCode] = true;

    try {
      if (option.selected) {
        const descriptions = this.getPathDescriptions(path);
        await this.pathDescriptionsService.savePathDescription(this.projectId, hexCode, descriptions);
        this.notificationService.show('Alternativa creada exitosamente', 'success');
      } else {
        await this.pathDescriptionsService.deletePathDescription(this.projectId, hexCode);
        this.notificationService.show('Alternativa eliminada exitosamente', 'success');
      }
      await this.loadExistingPaths();
    } catch (error) {
      this.notificationService.show('Error en la operación', 'error');
      option.selected = !option.selected;
    } finally {
      delete this.updatingOptions[hexCode];
      this.changeDetectorRef.detectChanges();
    }
  }

  private getPathDescriptions(path: string[]): string[] {
    const descriptions: string[] = [];
    let currentNode = this.decisionTree;

    for (const pathId of path) {
      const currentArea = currentNode[0];
      const option = currentArea.options.find(opt => opt.id === pathId);
      
      if (option) {
        descriptions.push(option.text);
        if (option.children) {
          currentNode = option.children;
        }
      }
    }

    return descriptions;
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
