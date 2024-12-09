import { Component } from '@angular/core';
import { OpcionService } from '../../../services/opcion.service';
import { DecisionService } from '../../../services/decision.service';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OpcionesDBService } from '../../../services/_Opciones/opciones-db.service';
import { DecisionesDBService } from '../../../services/_Decisiones/decisiones-db.service';

@Component({
  selector: 'app-crear-opcion',
  standalone: true,
  imports: [ ReactiveFormsModule, CommonModule, FormsModule ],
  providers: [ OpcionService, DecisionService, OpcionesDBService, DecisionesDBService ],
  templateUrl: './crear-opcion.component.html',
  styleUrl: './crear-opcion.component.css'
})
export class CrearOpcionComponent {
  areasDecisiones: any[] = [];
  selectedAreaId: string = '';

    constructor( private opcionService: OpcionService, private decisionService: DecisionService, private decisionDbService :DecisionesDBService,
                 private opcionDbService:  OpcionesDBService
     ) {
      // this.decisionService.getDecisiones().subscribe((data: any[]) => {
      //   this.areasDecisiones = data;
      // });

      this.decisionDbService.getItems().subscribe((data: any[]) => {
        this.areasDecisiones = data;
      })
    }

    addOpcion(opcion : HTMLInputElement) {
      if (!this.selectedAreaId) {
        alert("Por favor selecciona un área de decisión.");
        opcion.value = '';
        return false;
      }
      const id = Date.now().toString();
      //this.opcionService.addOpcion({
       this.opcionDbService.createItem({
        _id: id,
        descripcion: opcion.value,
        cod_area: this.selectedAreaId
      }).subscribe(() => {
      opcion.value = '';
      this.selectedAreaId = '';
    });
    return false;
  }
}
