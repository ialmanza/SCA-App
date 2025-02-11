// import { map } from 'rxjs';
// import { Component } from '@angular/core';
// import { GrafoComponent } from "../grafo/grafo.component";
// import { FormsModule } from '@angular/forms';
// import { Decision } from '../../models/decision';
// import { CommonModule } from '@angular/common';
// import { VinculodbService } from '../../services/_Vinculos/vinculodb.service';
// import { DecisionesDBService } from '../../services/_Decisiones/decisiones-db.service';

// @Component({
//   selector: 'app-vinculos',
//   standalone: true,
//   imports: [GrafoComponent, FormsModule, CommonModule],
//   providers: [DecisionesDBService, VinculodbService],
//   templateUrl: './vinculos.component.html',
//   styleUrl: './vinculos.component.css'
// })
// export class VinculosComponent {
//   selectedArea1: Decision | null = null;
//   selectedArea2: Decision | null = null;
//   areas: Decision[] = [];
//   vinculos: string[] = [];
//   decisiones : Decision[];

//   constructor( private decisionesDBService: DecisionesDBService, private vinculodbService: VinculodbService) {
//     this.decisiones = [];
//   }

//   ngOnInit(): void {
//     this.decisionesDBService.getItems().subscribe((decisiones : Decision[]) => {
//       this.areas = decisiones
//       this.decisiones = decisiones.map(decision => ({ ...decision, seleccionado: false }));
//     });

//     //this.eliminarVinculos();

//     // this.vinculodbService.getItems().subscribe((vinculos: string[]) => {
//     //   this.vinculos = vinculos;
//     // });
//     this.cargarVinculos();
//   }

//   cargarVinculos(): void {
//     this.vinculodbService.getItems().subscribe((response: any) => {
//       // Asegúrate de acceder a la propiedad 'vinculos' del response
//       this.vinculos = response.vinculos || [];
//       console.log('Vínculos cargados:', this.vinculos);
//     }, error => {
//       console.error('Error al cargar vínculos', error);
//       this.vinculos = [];
//     });
//   }

//   crearVinculo(): void {   //QUE FUNCIONA CORRECTAMENTE
//     if (this.selectedArea1 && this.selectedArea2 && this.selectedArea1 !== this.selectedArea2) {
//       const area_id = this.selectedArea1.id!;
//       const related_area_id = this.selectedArea2.id!;
//       this.vinculodbService.createItem(area_id, related_area_id).subscribe(() => {
//         // Recarga los vínculos después de crear uno nuevo
//         this.cargarVinculos();
//         this.selectedArea1 = null;
//         this.selectedArea2 = null;
//       }, error => {
//         console.error('Error al crear vínculo', error);
//       });
//     } else {
//       console.error('Áreas no válidas para crear un vínculo.');
//     }
//   }

//   // crearVinculo(): void {
//   //   if (this.selectedArea1 && this.selectedArea2 && this.selectedArea1 !== this.selectedArea2) {
//   //     const vinculoId = Date.now() + Math.floor(Math.random() * 1000);
//   //     const area_id = this.selectedArea1.id!;
//   //     const related_area_id = this.selectedArea2.id!;
//   //     this.vinculodbService.createItem(area_id, related_area_id, vinculoId).subscribe(() => {
//   //       // Recarga los vínculos después de crear uno nuevo
//   //       this.cargarVinculos();
//   //       this.selectedArea1 = null;
//   //       this.selectedArea2 = null;
//   //     }, error => {
//   //       console.error('Error al crear vínculo', error);
//   //     });
//   //   } else {
//   //     console.error('Áreas no válidas para crear un vínculo.');
//   //   }
//   // }

//   // eliminarVinculo (vinculo: string): void {
//   //   this.vinculodbService.deleteItem(vinculo).subscribe(() => {
//   //     this.cargarVinculos();
//   //   })
//   // }

//   eliminarVinculo(vinculo: string): void {
//     const [area_id, related_area_id] = vinculo.split('-');
//     if (!area_id || !related_area_id) {
//       console.error("Error: Formato de vínculo incorrecto", vinculo);
//       return;
//     }

//     this.vinculodbService.deleteItem(area_id, related_area_id).subscribe(() => {
//       this.cargarVinculos();
//     }, error => {
//       console.error('Error al eliminar vínculo', error);
//     });
//   }


// }


import { map } from 'rxjs';
import { Component } from '@angular/core';
import { GrafoComponent } from "../grafo/grafo.component";
import { FormsModule } from '@angular/forms';
import { Decision } from '../../models/decision';
import { CommonModule } from '@angular/common';
import { VinculodbService } from '../../services/_Vinculos/vinculodb.service';
import { DecisionesDBService } from '../../services/_Decisiones/decisiones-db.service';

interface Vinculo {
  nombre: string;
  area_id: number;
  related_area_id: number;
}

@Component({
  selector: 'app-vinculos',
  standalone: true,
  imports: [GrafoComponent, FormsModule, CommonModule],
  providers: [DecisionesDBService, VinculodbService],
  templateUrl: './vinculos.component.html',
  styleUrl: './vinculos.component.css'
})
export class VinculosComponent {
  selectedArea1: Decision | null = null;
  selectedArea2: Decision | null = null;
  areas: Decision[] = [];
  vinculos: Vinculo[] = [];
  decisiones: Decision[];

  constructor(
    private decisionesDBService: DecisionesDBService,
    private vinculodbService: VinculodbService
  ) {
    this.decisiones = [];
  }

  ngOnInit(): void {
    this.decisionesDBService.getItems().subscribe((decisiones: Decision[]) => {
      this.areas = decisiones;
      this.decisiones = decisiones.map(decision => ({ ...decision, seleccionado: false }));
    });

    this.cargarVinculos();
  }

  cargarVinculos(): void {
    this.vinculodbService.getItems().subscribe((response: any) => {
      // Transform the vinculos array to our interface format
      this.vinculos = response.vinculos.map((vinculo: any[]) => ({
        nombre: vinculo[0],
        area_id: vinculo[1],
        related_area_id: vinculo[2]
      }));
      console.log('Vínculos cargados:', this.vinculos);
    }, error => {
      console.error('Error al cargar vínculos', error);
      this.vinculos = [];
    });
  }

  crearVinculo(): void {
    if (this.selectedArea1 && this.selectedArea2 && this.selectedArea1 !== this.selectedArea2) {
      const area_id = this.selectedArea1.id!;
      const related_area_id = this.selectedArea2.id!;
      this.vinculodbService.createItem(area_id, related_area_id).subscribe(() => {
        this.cargarVinculos();
        this.selectedArea1 = null;
        this.selectedArea2 = null;
      }, error => {
        console.error('Error al crear vínculo', error);
      });
    } else {
      console.error('Áreas no válidas para crear un vínculo.');
    }
  }

  eliminarVinculo(vinculo: Vinculo): void {
    this.vinculodbService.deleteItem(
      vinculo.area_id,
      vinculo.related_area_id
    ).subscribe(() => {
      this.cargarVinculos();
    }, error => {
      console.error('Error al eliminar vínculo', error);
    });
  }
}
