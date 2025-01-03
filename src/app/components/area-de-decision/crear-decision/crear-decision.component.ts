import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DecisionService } from '../../../services/decision.service';
import { CommonModule } from '@angular/common';
import 'flowbite';
import { DecisionesDBService } from '../../../services/_Decisiones/decisiones-db.service';


@Component({
  selector: 'app-crear-decision',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  providers: [DecisionService,  DecisionesDBService],
  templateUrl: './crear-decision.component.html',
  styleUrl: './crear-decision.component.css'
})
export class CrearDecisionComponent {
rotuloValue: any;

  constructor( private decisionesDBService: DecisionesDBService) {}

  addDecision( area:HTMLInputElement, descripcion:HTMLTextAreaElement) {
    const rotuloPattern = /^[A-Z]{3}_[A-Z]{3}$/;

    // if (!rotuloPattern.test(this.rotuloValue)) {
    //   alert('El rotulo debe estar en el formato "ABC_DEF".');
    //   area.value = '';
    //   this.rotuloValue = '';
    //   descripcion.value = '';
    //   return;
    // }

    if (!area.value || !descripcion.value) {
      alert('Por favor rellene todos los campos.');
      area.value = '';
      this.rotuloValue = '';
      descripcion.value = '';
      return;
    }
    const id = Date.now().toString();
      this.decisionesDBService.createItem({
        id: id,
        area: area.value,
        rotulo: this.rotuloValue,
        description: descripcion.value

      }).subscribe(() => {
        area.value = '';
        this.rotuloValue = '';
        descripcion.value = '';
      })

      return false;
  }

}
