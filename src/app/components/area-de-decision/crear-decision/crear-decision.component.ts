import { Component } from '@angular/core';
import {  FormControl } from '@angular/forms';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DecisionService } from '../../../services/decision.service';
import 'flowbite';


@Component({
  selector: 'app-crear-decision',
  standalone: true,
  imports: [ ReactiveFormsModule, FormsModule],
  providers: [DecisionService],
  templateUrl: './crear-decision.component.html',
  styleUrl: './crear-decision.component.css'
})
export class CrearDecisionComponent {

  constructor(private decisionService: DecisionService) {}

  addDecision(rotulo:HTMLInputElement, area:HTMLInputElement, descripcion:HTMLTextAreaElement) {
    const id = Date.now().toString();
      this.decisionService.addDecision({
        id: id,
        area: area.value,
        rotulo: rotulo.value,
        description: descripcion.value

      })
      area.value = '';
      rotulo.value = '';
      descripcion.value = '';
      rotulo.focus();
      return false;
  }

}
