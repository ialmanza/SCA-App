import { Component } from '@angular/core';
import {FormBuilder, Validators, FormsModule, ReactiveFormsModule, FormGroup} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CrearDecisionComponent } from "../crear-decision/crear-decision.component";
import { ListarDecisionesComponent } from "../listar-decisiones/listar-decisiones.component";
import { Decision } from '../../../models/decision';
import { DecisionService } from '../../../services/decision.service';

@Component({
  selector: 'app-decisiones-form',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule, CrearDecisionComponent, ListarDecisionesComponent],
  templateUrl: './decisiones-form.component.html',
  styleUrl: './decisiones-form.component.css'
})
export class DecisionesFormComponent {

  pasoActual: number = 1;
  decisiones : Decision[];



  constructor( private decisionService: DecisionService) {
    this.decisiones = [];
  }

  ngOnInit(): void {
    this.decisionService.getDecisiones().subscribe((decisiones : Decision[]) => {
      //this.decisiones = decisiones
      this.decisiones = decisiones.map(decision => ({ ...decision, seleccionado: false }));
    });
  }

  addDecision(rotulo:HTMLInputElement, area:HTMLInputElement, descripcion:HTMLTextAreaElement) {
    const id = Date.now().toString();
      this.decisionService.addDecision({
        id: id,
        area: area.value,
        rotulo: rotulo.value,
        description: descripcion.value

      })
      console.log( "Area: ", area.value, "Rotulo: ", rotulo.value, "Descripción: ", descripcion.value); //para debug
      area.value = '';
      rotulo.value = '';
      descripcion.value = '';
      rotulo.focus();
      return false;
  }
  deleteDecision(decisiones : Decision) {
    if(confirm('Está seguro que desea borrar esta área de decisión?')) {
      this.decisionService.deleteDecision(decisiones.id);
    }
  }

  avanzarPaso() {
    if (this.pasoActual < 10) {
      this.pasoActual++;
    }
  }

  retrocederPaso() {
    if (this.pasoActual > 1) {
      this.pasoActual--;
    }
  }

  // guardarSeleccion(decision: any): void {
  //   if (decision.seleccionado) {
  //     this.areasSeleccionadas.push(decision.area);
  //     console.log(this.areasSeleccionadas);
  //   } else {
  //     this.areasSeleccionadas = this.areasSeleccionadas.filter(area => area !== decision.area);
  //   }


  // }




}
