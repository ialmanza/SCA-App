import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Decision } from '../../models/decision';
import { Opcion } from '../../models/opcion';
import { DecisionService } from '../../services/decision.service';
import { OpcionService } from '../../services/opcion.service';
import { SelectedPathsService } from '../../services/selected-path.service';

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
  providers: [OpcionService, DecisionService],
  templateUrl: './posibles-alternativas.component.html',
  styleUrls: ['./posibles-alternativas.component.css'],
})
export class PosiblesAlternativasComponent implements OnInit {
  decisions: Decision[] = [];
  opciones: Opcion[] = [];
  decisionTree: DecisionNode[] = [];

  constructor(
    private decisionService: DecisionService,
    private opcionService: OpcionService,
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
    this.decisionService.getDecisiones().subscribe(decisions => {
      this.decisions = decisions;
      this.opcionService.getOpciones().subscribe(opciones => {
        this.opciones = opciones;
        this.buildDecisionTree();
      });
    });
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
    const areaOptions = this.getOpcionesPorArea(areaDecisions[0]._id);
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

  getUniqueAreas(): string[] {
    return Array.from(new Set(this.decisions.map(d => d.area)));
  }

  getDecisionsByArea(area: string): Decision[] {
    return this.decisions.filter(d => d.area === area);
  }

  getOpcionesPorArea(areaId: string): Opcion[] {
    return this.opciones.filter(opcion => opcion.cod_area === areaId);
  }

  generateHexCode(text: string): string {
    const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `#${hash.toString(16).padStart(6, '0')}`;
  }
}
