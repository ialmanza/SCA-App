// import { Component, OnInit } from '@angular/core';
// import { Opcion } from '../../models/opcion';
// import { Decision } from '../../models/decision';
// import { OpcionService } from '../../services/opcion.service';
// import { DecisionService } from '../../services/decision.service';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-posibles-alternativas',
//   standalone: true,
//   imports: [ CommonModule ],
//   providers: [OpcionService, DecisionService],
//   templateUrl: './posibles-alternativas.component.html',
//   styleUrl: './posibles-alternativas.component.css'
// })
// export class PosiblesAlternativasComponent implements OnInit {
//   decisions: Decision[] = [];

//   constructor(
//     private decisionService: DecisionService,
//     private opcionService: OpcionService
//   ) {}

//   ngOnInit(): void {
//     this.loadDecisionTree();
//   }

//   loadDecisionTree(): void {
//     this.decisionService.getDecisiones().subscribe((decisiones: Decision[]) => {
//       this.decisions = decisiones.map((decision) => {
//         const opciones = this.getOpcionesForDecision(decision.id);
//         return { ...decision, opciones };
//       });
//     });
//   }

//   getOpcionesForDecision(decisionId: string): Opcion[] {
//     let opciones: Opcion[] = [];
//     this.opcionService.getOpciones().subscribe((storedOpciones) => {
//       opciones = storedOpciones.filter(
//         (opcion: Opcion) => opcion.cod_area === decisionId
//       );
//     });
//     return opciones;
//   }
// }
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Decision } from '../../models/decision';
import { Opcion } from '../../models/opcion';
import { DecisionService } from '../../services/decision.service';
import { OpcionService } from '../../services/opcion.service';

interface DecisionPath {
  id: string;
  path: string[];
  selected: boolean;
}

interface CombinedDecision {
  areas: string[];
  options: string[];
}

@Component({
  selector: 'app-posibles-alternativas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [OpcionService, DecisionService],
  templateUrl: './posibles-alternativas.component.html',
  styleUrl: './posibles-alternativas.component.css'
})
export class PosiblesAlternativasComponent implements OnInit {
  decisions: Decision[] = [];
  decisionPaths: DecisionPath[] = [];
  combinedDecisions: CombinedDecision[] = [];
  opciones: Opcion[] = [];

  constructor(
    private decisionService: DecisionService,
    private opcionService: OpcionService
  ) {}

  ngOnInit(): void {
    this.loadDecisionsAndOptions();
  }

  loadDecisionsAndOptions(): void {
    this.decisionService.getDecisiones().subscribe(decisions => {
      this.decisions = decisions;
      this.opcionService.getOpciones().subscribe(opciones => {
        this.opciones = opciones;
        this.generateCombinedDecisions();
        this.generateDecisionPaths();
      });
    });
  }

  generateCombinedDecisions(): void {
    const uniqueAreas = this.getUniqueAreas();
    this.combinedDecisions = [];

    // Combinar primera opción de cada área
    for (let i = 0; i < uniqueAreas.length - 1; i++) {
      const currentArea = uniqueAreas[i];
      const nextArea = uniqueAreas[i + 1];

      const currentAreaOptions = this.getOpcionesPorArea(
        this.getDecisionsByArea(currentArea)[0].id
      );
      const nextAreaOptions = this.getOpcionesPorArea(
        this.getDecisionsByArea(nextArea)[0].id
      );

      currentAreaOptions.forEach(currentOption => {
        nextAreaOptions.forEach(nextOption => {
          this.combinedDecisions.push({
            areas: [currentArea, nextArea],
            options: [currentOption.descripcion, nextOption.descripcion]
          });
        });
      });
    }
  }

  getOpcionesPorArea(areaId: string): Opcion[] {
    return this.opciones.filter(opcion => opcion.cod_area === areaId);
  }

  generateDecisionPaths(): void {
    let paths: string[][] = [[]];
    const areas = this.getUniqueAreas();

    areas.forEach(area => {
      const areaDecisions = this.decisions.filter(d => d.area === area);
      const newPaths: string[][] = [];

      paths.forEach(currentPath => {
        areaDecisions.forEach(decision => {
          decision.opciones?.forEach(opcion => {
            newPaths.push([...currentPath, opcion.descripcion]);
          });
        });
      });

      paths = newPaths;
    });

    this.decisionPaths = paths.map((path, index) => ({
      id: `path-${index}`,
      path: path,
      selected: false
    }));
  }

  getUniqueAreas(): string[] {
    return Array.from(new Set(this.decisions.map(d => d.area)));
  }

  getDecisionsByArea(area: string): Decision[] {
    return this.decisions.filter(d => d.area === area);
  }

  togglePathSelection(path: DecisionPath): void {
    path.selected = !path.selected;
  }

  getAlternativeLabel(index: number): string {
    return String.fromCharCode(65 + index);
  }

  isOptionSelected(area: string, optionText: string): boolean {
    const selectedPath = this.decisionPaths.find(path => path.selected);
    return selectedPath ? selectedPath.path.includes(optionText) : false;
  }
}

////////////////////////////////////EL TIPO ES EL DE ABAJO///////////////////////////////////////////////////////////////////////////////////////////////////

// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Decision } from '../../models/decision';
// import { Opcion } from '../../models/opcion';
// import { DecisionService } from '../../services/decision.service';
// import { OpcionService } from '../../services/opcion.service';

// interface DecisionPath {
//   id: string;
//   path: string[];
//   selected: boolean;
// }


// @Component({
//   selector: 'app-posibles-alternativas',
//   standalone: true,
//   imports: [ CommonModule, FormsModule ],
//   providers: [OpcionService, DecisionService],
//   templateUrl: './posibles-alternativas.component.html',
//   styleUrl: './posibles-alternativas.component.css'
// })
// export class PosiblesAlternativasComponent implements OnInit {
//   decisions: Decision[] = [];
//   decisionPaths: DecisionPath[] = [];
//   selectedArea: string | null = null;
//   opciones: Opcion[];

//   constructor(private decisionService: DecisionService, private opcionService: OpcionService) {
//     this.opciones = [];
//   }

//   ngOnInit(): void {
//     this.loadDecisions();

//     this.opcionService.getOpciones().subscribe((opciones: Opcion[]) => {
//       this.opciones = opciones;
//     });
//   }

//   getOpcionesPorArea(areaId: string) {
//     return this.opciones.filter(opcion => opcion.cod_area === areaId);  // Filtrar opciones por área de decisión
//   }

//   loadDecisions(): void {
//     this.decisionService.getDecisiones().subscribe(decisions => {
//       this.decisions = decisions;
//       this.generateDecisionPaths();
//     });
//   }

//   generateDecisionPaths(): void {
//     let paths: string[][] = [[]];
//     let areas = this.getUniqueAreas();

//     areas.forEach(area => {
//       const areaDecisions = this.decisions.filter(d => d.area === area);
//       const newPaths: string[][] = [];

//       paths.forEach(currentPath => {
//         areaDecisions.forEach(decision => {
//           decision.opciones?.forEach(opcion => {
//             newPaths.push([...currentPath, opcion.descripcion]);
//           });
//         });
//       });

//       paths = newPaths;
//     });

//     this.decisionPaths = paths.map((path, index) => ({
//       id: `path-${index}`,
//       path: path,
//       selected: false
//     }));
//   }

//   getUniqueAreas(): string[] {
//     return Array.from(new Set(this.decisions.map(d => d.area)));
//   }

//   getDecisionsByArea(area: string): Decision[] {
//     return this.decisions.filter(d => d.area === area);
//   }

//   togglePathSelection(path: DecisionPath): void {
//     path.selected = !path.selected;
//   }

//   getAlternativeLabel(index: number): string {
//     return String.fromCharCode(65 + index);
//   }

//   isOptionSelected(area: string, optionText: string): boolean {
//     const selectedPath = this.decisionPaths.find(path => path.selected);
//     if (selectedPath) {
//       return selectedPath.path.includes(optionText);
//     }
//     return false;
//   }
// }
