import { Component } from '@angular/core';
import {FormBuilder, Validators, FormsModule, ReactiveFormsModule, FormGroup} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CrearDecisionComponent } from "../crear-decision/crear-decision.component";
import { ListarDecisionesComponent } from "../listar-decisiones/listar-decisiones.component";
import { Decision } from '../../../models/decision';
import { DecisionService } from '../../../services/decision.service';
import { OpcionService } from '../../../services/opcion.service';
import { Opcion } from '../../../models/opcion';
import { DialogAnimationsExampleDialog } from '../eliminar-decision-modal/eliminar-decision.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-decisiones-form',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule, CrearDecisionComponent, ListarDecisionesComponent],
  providers: [DecisionService, OpcionService],
  templateUrl: './decisiones-form.component.html',
  styleUrl: './decisiones-form.component.css'
})
export class DecisionesFormComponent {

  pasoActual: number = 1;
  decisiones : Decision[];
  opciones: Opcion[];
  rotuloValue: any;



  constructor( private decisionService: DecisionService, private opcionService: OpcionService, public dialog: MatDialog) {
    this.decisiones = [];
    this.opciones = [];
  }

  ngOnInit(): void {
    this.decisionService.getDecisiones().subscribe((decisiones : Decision[]) => {
      //this.decisiones = decisiones
      this.decisiones = decisiones.map(decision => ({ ...decision, seleccionado: false }));
    });

    this.opcionService.getOpciones().subscribe((opciones: Opcion[]) => {
      this.opciones = opciones;
    });
  }

  addDecision( area:HTMLInputElement, descripcion:HTMLTextAreaElement) {
    const rotuloPattern = /^[A-Z]{3}-[A-Z]{3}$/;

    if (!rotuloPattern.test(this.rotuloValue)) {
      alert('El rotulo debe estar en el formato "ABC-DEF".');
      area.value = '';
      this.rotuloValue = '';
      descripcion.value = '';
      return;
    }

    if (!area.value || !descripcion.value) {
      alert('Por favor rellene todos los campos.');
      area.value = '';
      this.rotuloValue = '';
      descripcion.value = '';
      return;
    }

    const id = Date.now().toString();
      this.decisionService.addDecision({
        id: id,
        area: area.value,
        rotulo: this.rotuloValue,
        description: descripcion.value

      })
      area.value = '';
      this.rotuloValue = '';
      descripcion.value = '';
      return false;
  }
  // deleteDecision(decisiones : Decision) {
  //   if(confirm('Está seguro que desea borrar esta área de decisión?')) {
  //     this.decisionService.deleteDecision(decisiones.id);
  //   }
  // }

  deleteDecision(decision: Decision) {
    const dialogRef = this.dialog.open(DialogAnimationsExampleDialog, {
      width: '250px',
      data: decision
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.decisionService.deleteDecision(decision.id);
      }
    });
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

  getOpcionesPorArea(areaId: string) {
    return this.opciones.filter(opcion => opcion.cod_area === areaId);  // Filtrar opciones por área de decisión
  }


   //FUNCIONALIDAD EN DESARROLLO
  // guardarSeleccion(decision: any): void {
  //   if (decision.seleccionado) {
  //     this.areasSeleccionadas.push(decision.area);
  //     console.log(this.areasSeleccionadas);
  //   } else {
  //     this.areasSeleccionadas = this.areasSeleccionadas.filter(area => area !== decision.area);
  //   }


  // }


}
