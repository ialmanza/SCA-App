import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Decision } from '../../../models/decision';
import { DecisionService } from '../../../services/decision.service';

@Component({
  selector: 'app-decision',
  standalone: true,
  imports: [ CommonModule, FormsModule ],
  templateUrl: './decision.component.html',
  styleUrl: './decision.component.css'
})
export class DecisionComponent {
  @Input() decisiones!: Decision
  editing: boolean = false;

  constructor(private decisionService: DecisionService) {}

  deleteDecision(decisiones : Decision) {
    if(confirm('Está seguro que desea borrar esta área de decisión?')) {
      this.decisionService.deleteDecision(decisiones._id);
    }
  }


}
