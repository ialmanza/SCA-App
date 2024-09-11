import { Component } from '@angular/core';
import { OpcionService } from '../../../services/opcion.service';
import { DecisionService } from '../../../services/decision.service';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-crear-opcion',
  standalone: true,
  imports: [ ReactiveFormsModule, CommonModule, FormsModule ],
  providers: [ OpcionService, DecisionService ],
  templateUrl: './crear-opcion.component.html',
  styleUrl: './crear-opcion.component.css'
})
export class CrearOpcionComponent {
  areasDecisiones: any[] = [];
  selectedAreaId: string = '';

    constructor( private opcionService: OpcionService, private decisionService: DecisionService) {
      this.decisionService.getDecisiones().subscribe((data: any[]) => {
        this.areasDecisiones = data;
      });
    }

    addOpcion(opcion : HTMLInputElement) {
      if (!this.selectedAreaId) {
        alert("Por favor selecciona un área de decisión.");
        opcion.value = '';
        return false;
      }
      const id = Date.now().toString();
      this.opcionService.addOpcion({
        id: id,
        descripcion: opcion.value,
        cod_area: this.selectedAreaId
      });

      opcion.value = '';
      this.selectedAreaId = '';
      return false;
    }

}
