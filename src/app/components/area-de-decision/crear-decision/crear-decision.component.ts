import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DecisionService } from '../../../services/decision.service';
import { CommonModule } from '@angular/common';
import 'flowbite';


@Component({
  selector: 'app-crear-decision',
  standalone: true,
  imports: [ ReactiveFormsModule, FormsModule, CommonModule],
  providers: [DecisionService],
  templateUrl: './crear-decision.component.html',
  styleUrl: './crear-decision.component.css'
})
export class CrearDecisionComponent {
rotuloValue: any;

  constructor(private decisionService: DecisionService) {}

  addDecision( area:HTMLInputElement, descripcion:HTMLTextAreaElement) {
    const rotuloPattern = /^[A-Z]{3}_[A-Z]{3}$/;

    if (!rotuloPattern.test(this.rotuloValue)) {
      alert('El rotulo debe estar en el formato "ABC_DEF".');
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

}
