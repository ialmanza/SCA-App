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
import { NotificationService } from '../../services/_Notification/notification.service';
import { NotificationsComponent } from "../notifications/notifications.component";

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
    private changeDetectorRef: ChangeDetectorRef,
    private notificationservice : NotificationService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const importantAreas = await firstValueFrom(this.decisionService.getImportantStatus());

      if (importantAreas.length === 0) {
        this.notificationservice.show('No hay áreas importantes', 'info');

        return;
      }

      const areas = importantAreas.map(area => area.area);
      this.uniqueAreasSubject.next(areas);

      await this.loadDecisionsAndOptions();

      await this.loadExistingPaths();

      this.isLoading = false;
      this.changeDetectorRef.detectChanges();
    } catch (error) {
      this.notificationservice.show('Error en la inicialización', 'error');
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
      this.notificationservice.show('Error al cargar datos', 'error');
      throw error;
    }
  }

  async loadExistingPaths(): Promise<void> {
    try {
      const paths = await firstValueFrom(this.selectedPathsService.getPathsFromBackend());
      this.paths = paths;
      this.updateTreeSelections();
    } catch (error) {
      this.notificationservice.show('Error obteniendo paths', 'error');
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
      this.selectedPathsService.addPathToBackend(hexCode, numericPaths.map(String))
        .subscribe({
          next: (response) => {
            this.notificationservice.show('Alternativa creada exitosamente', 'success');
            this.loadExistingPaths();
          },
          error: (error) => {
            this.notificationservice.show('Error creando alternativa', 'error');
            option.selected = false;
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
            this.notificationservice.show('Alternativa eliminada exitosamente', 'success');
            this.loadExistingPaths();
          },
          error: (error) => {
            this.notificationservice.show('Error eliminando alternativa', 'error');
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
