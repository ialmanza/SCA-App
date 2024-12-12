import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Decision } from '../../models/decision';
import { Opcion } from '../../models/opcion';
import {DecisionesDBService} from '../../services/_Decisiones/decisiones-db.service';
import {OpcionesDBService} from '../../services/_Opciones/opciones-db.service';
import { SelectedPathsService } from '../../services/selected-path.service';
import { forkJoin } from 'rxjs';

interface DecisionNode {
  areaTitle: string;
  options: {
    selected: boolean;
    text: string;
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
  uniqueAreas: string[] = [];

  constructor(
    private decisionService: DecisionesDBService,
    private opcionService: OpcionesDBService,
    private selectedPathsService: SelectedPathsService
  ) {}

  ngOnInit(): void {
    this.loadDecisionsAndOptions();
  }

  onOptionSelected(option: any, path: string[]) {
    const hexCode = this.generateHexCode(option.text);

    if (option.selected) {
      this.selectedPathsService.addPath(hexCode, path);
      console.log(hexCode, "added", path);
    } else {
      this.selectedPathsService.removePath(hexCode);
      console.log(hexCode, "removed", path);
    }
  }

  loadDecisionsAndOptions(): void {
    this.decisionService.getItems().subscribe(decisions => {
      this.decisions = decisions;
      this.opcionService.getItems().subscribe(opciones => {
        this.opciones = opciones;
        this.buildDecisionTree();
      });
    });
  }

  getUniqueAreas(): string[] {
    this.decisionService.getImportantStatus().subscribe(
          importantAreas => {

            if (importantAreas.length === 0) {
              console.warn('No hay áreas importantes');
              return;
            }
            this.uniqueAreas = importantAreas.map(area => area.nombre || area.area);
          });
          (error: any) => {
                  console.error('Error al cargar áreas importantes:', error);
                }
    return this.uniqueAreas;
  }



  // cargarVinculos(): void {
  //   this.vinculodbService.getItems().subscribe((response: any) => {
  //     // Asegúrate de acceder a la propiedad 'vinculos' del response
  //     this.vinculos = response.vinculos || [];
  //   }, error => {
  //     console.error('Error al cargar vínculos', error);
  //     this.vinculos = [];
  //   });
  // }

  // loadDecisionsAndOptions(): void {
  //   this.decisionService.getImportantStatus().subscribe(
  //     importantAreas => {
  //       console.log('Important Areas:', importantAreas);


  //       if (importantAreas.length === 0) {
  //         console.warn('No hay áreas importantes');
  //         return;
  //       }


  //       this.uniqueAreas = importantAreas.map(area => area.nombre || area.area);


  //       forkJoin({
  //         decisions: this.decisionService.getItems(),
  //         opciones: this.opcionService.getItems()
  //       }).subscribe(
  //         ({ decisions, opciones }) => {
  //           console.log('Decisions:', decisions);
  //           console.log('Opciones:', opciones);


  //           if (decisions.length === 0 || opciones.length === 0) {
  //             console.warn('No hay decisiones u opciones');
  //             return;
  //           }


  //           this.decisions = decisions;
  //           this.opciones = opciones;


  //           this.buildDecisionTree();
  //         },
  //         error => {
  //           console.error('Error al cargar datos:', error);
  //         }
  //       );
  //     },
  //     error => {
  //       console.error('Error al cargar áreas importantes:', error);
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
    const areaOptions = this.getOpcionesPorArea(areaDecisions[0].id?.toString() ?? '');
    const isLastArea = currentIndex === areas.length - 1;

    const node: DecisionNode = {
      areaTitle: currentArea,
      options: areaOptions.map((option, index) => ({
        text: option.descripcion,
        selected: false,
        children: isLastArea
          ? undefined
          : this.buildTreeRecursive(areas, currentIndex + 1),
        isLastChild: index === areaOptions.length - 1,
        isLastArea: isLastArea
      }))
    };

    return [node];
  }

  // getUniqueAreas(): string[] {
  //   return Array.from(new Set(this.decisions.map(d => d.area)));
  // }

  getDecisionsByArea(area: string): Decision[] {
    return this.decisions.filter(d => d.area.toString() === area.toString());
  }

  getOpcionesPorArea(areaId: string): Opcion[] {
    return this.opciones.filter(opcion => opcion.cod_area === areaId);
  }

  generateHexCode(text: string): string {
    const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `#${hash.toString(16).padStart(6, '0')}`;
  }
}
