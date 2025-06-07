import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Decision } from '../../models/decision';
import { Opcion } from '../../models/interfaces';
import { OpcionesService } from '../../services/supabaseServices/opciones.service';
import { SelectedPathsService } from '../../services/supabaseServices/selected-paths.service';
import { PathDescriptionsService } from '../../services/supabaseServices/path-descriptions.service';
import { BehaviorSubject, firstValueFrom, Subscription } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { NotificationService } from '../../services/_Notification/notification.service';
import { NotificationsComponent } from "../notifications/notifications.component";
import { DecisionsService } from '../../services/supabaseServices/decisions.service';
import { supabase } from '../../config/supabase.config';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslationService } from '../../services/translation.service';

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
  imports: [CommonModule, FormsModule, NotificationsComponent, TranslateModule],
  providers: [SelectedPathsService, OpcionesService, PathDescriptionsService],
  templateUrl: './posibles-alternativas.component.html',
  styleUrls: ['./posibles-alternativas.component.css'],
})
export class PosiblesAlternativasComponent implements OnInit, OnDestroy {
  decisions: Decision[] = [];
  opciones: Opcion[] = [];
  decisionTree: DecisionNode[] = [];
  private uniqueAreasSubject = new BehaviorSubject<string[]>([]);
  uniqueAreas$ = this.uniqueAreasSubject.asObservable();
  paths: any[] = [];
  contador: number = 0;
  updatingOptions: { [key: string]: boolean } = {};
  isLoading: boolean = true;
  isFullscreen: boolean = false;
  @Input() projectId!: string;
  private subscription: Subscription = new Subscription();
  private previousSelections: { [key: string]: boolean } = {};
  selectedOptionsCount: number = 0; // Total de alternativas posibles
  selectedAlternativesCount: number = 0; // Contador de alternativas seleccionadas

  constructor(
    private opcionesService: OpcionesService,
    private selectedPathsService: SelectedPathsService,
    private decisionsService: DecisionsService,
    private pathDescriptionsService: PathDescriptionsService,
    private changeDetectorRef: ChangeDetectorRef,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    private translationService: TranslationService
  ) {}

  async ngOnInit(): Promise<void> {
    if (!this.projectId) {
      //this.notificationService.show('ID de proyecto no encontrado', 'error');
      this.notificationService.show(this.translateService.instant('posiblesAlternativas.notifications.projectIdNotFound'), 'error');
      this.isLoading = false;
      return;
    }

    try {
      // Suscribirse a cambios en las áreas importantes
      this.subscription.add(
        this.decisionsService.getImportantStatus(this.projectId).subscribe(async (importantAreas) => {
          if (importantAreas.length === 0) {
            //this.notificationService.show('No hay áreas importantes para este proyecto', 'info');
            this.notificationService.show(this.translateService.instant('posiblesAlternativas.notifications.noImportantAreas'), 'info');
            this.isLoading = false;
            return;
          }

          const areas = importantAreas.map(area => area.nombre_area);
          this.uniqueAreasSubject.next(areas);

          // Guardar selecciones actuales antes de actualizar
          this.saveCurrentSelections();

          await this.loadDecisionsAndOptions();
          await this.loadExistingPaths();

          // Restaurar selecciones después de actualizar
          this.restoreSelections();

          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        })
      );

      // Cargar datos iniciales
      const importantAreas = await firstValueFrom(this.decisionsService.getImportantStatus(this.projectId));
      if (importantAreas.length === 0) {
       // this.notificationService.show('No hay áreas importantes para este proyecto', 'info');
        this.notificationService.show(this.translateService.instant('posiblesAlternativas.notifications.noImportantAreas'), 'info');
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
      //this.notificationService.show('Error en la inicialización', 'error');
      this.notificationService.show(this.translateService.instant('posiblesAlternativas.notifications.initializationError'), 'error');
      this.isLoading = false;
    }
  }

  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
    if (this.isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    document.body.style.overflow = '';
  }

  private saveCurrentSelections(): void {
    this.previousSelections = {};
    const saveNodeSelections = (node: DecisionNode) => {
      node.options.forEach(option => {
        if (option.hexCode) {
          this.previousSelections[option.hexCode] = option.selected;
        }
        if (option.children) {
          option.children.forEach(childNode => saveNodeSelections(childNode));
        }
      });
    };

    this.decisionTree.forEach(node => saveNodeSelections(node));
  }

  private restoreSelections(): void {
    const restoreNodeSelections = (node: DecisionNode) => {
      node.options.forEach(option => {
        if (option.hexCode && this.previousSelections[option.hexCode]) {
          option.selected = this.previousSelections[option.hexCode];
          // Si la opción estaba seleccionada, actualizar en la base de datos
          if (option.selected) {
            const path = this.getPathForOption(option);
            if (path) {
              this.onOptionSelected(option, path);
            }
          }
        }
        if (option.children) {
          option.children.forEach(childNode => restoreNodeSelections(childNode));
        }
      });
    };

    this.decisionTree.forEach(node => restoreNodeSelections(node));
  }

  private getPathForOption(option: any): string[] | null {
    const findPath = (nodes: DecisionNode[], targetHexCode: string, currentPath: string[] = []): string[] | null => {
      for (const node of nodes) {
        for (const opt of node.options) {
          if (opt.hexCode === targetHexCode) {
            return [...currentPath, opt.id];
          }
          if (opt.children) {
            const childPath = findPath(opt.children, targetHexCode, [...currentPath, opt.id]);
            if (childPath) return childPath;
          }
        }
      }
      return null;
    };

    return findPath(this.decisionTree, option.hexCode);
  }

  async loadDecisionsAndOptions(): Promise<void> {
    const areas = this.getUniqueAreas();
    if (areas.length === 0) return;

    try {
      const decisions = await firstValueFrom(this.decisionsService.getDecisionsByProject(this.projectId));
      this.decisions = decisions;

      const opciones = await this.opcionesService.getOpcionesByProject(this.projectId);
      this.opciones = opciones;

      this.buildDecisionTree();
    } catch (error) {
      //this.notificationService.show('Error al cargar datos', 'error');
      this.notificationService.show(this.translateService.instant('posiblesAlternativas.notifications.loadingError'), 'error');
      throw error;
    }
  }

  async loadExistingPaths(): Promise<void> {
    try {
      const { data: paths, error } = await supabase
        .from('path_descriptions')
        .select('*')
        .eq('project_id', this.projectId);

      if (error) throw error;

      this.paths = paths || [];
      this.updateTreeSelections();
    } catch (error) {
      //this.notificationService.show('Error obteniendo paths', 'error');
      this.notificationService.show(this.translateService.instant('posiblesAlternativas.notifications.pathsError'), 'error');
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
    this.updateSelectedOptionsCount();
    this.updateSelectedAlternativesCount(); // Actualizar contador de seleccionadas
  }

  private updateSelectedOptionsCount(): void {
    this.selectedOptionsCount = 0;
    const countOptions = (node: DecisionNode) => {
      node.options.forEach(option => {
        if (option.isLastArea) {
          this.selectedOptionsCount++; // Contar todas las opciones del último nivel
        }
        if (option.children) {
          option.children.forEach(childNode => countOptions(childNode));
        }
      });
    };
    this.decisionTree.forEach(node => countOptions(node));
  }

  private updateSelectedAlternativesCount(): void {
    this.selectedAlternativesCount = 0;
    const countSelectedOptions = (node: DecisionNode) => {
      node.options.forEach(option => {
        if (option.isLastArea && option.selected) {
          this.selectedAlternativesCount++; // Contar solo las opciones del último nivel que están seleccionadas
        }
        if (option.children) {
          option.children.forEach(childNode => countSelectedOptions(childNode));
        }
      });
    };
    this.decisionTree.forEach(node => countSelectedOptions(node));
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
        //this.notificationService.show('Alternativa creada exitosamente', 'success');
        this.notificationService.show(this.translateService.instant('posiblesAlternativas.notifications.alternativeCreated'), 'success');

      } else {
        await this.pathDescriptionsService.deletePathDescription(this.projectId, hexCode);
        //this.notificationService.show('Alternativa eliminada exitosamente', 'success');
        this.notificationService.show(this.translateService.instant('posiblesAlternativas.notifications.alternativeDeleted'), 'success');

      }
      await this.loadExistingPaths();
      // Actualizar contador de alternativas seleccionadas después de la operación
      this.updateSelectedAlternativesCount();
    } catch (error) {
      //this.notificationService.show('Error en la operación', 'error');
      this.notificationService.show(this.translateService.instant('posiblesAlternativas.notifications.operationError'), 'error');
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
