import { Component } from '@angular/core';
import { catchError, EMPTY, switchMap } from 'rxjs';
import { Decision } from '../../../models/decision';
import { DecisionesDBService } from '../../../services/_Decisiones/decisiones-db.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-decision-check',
  standalone: true,
  imports: [ CommonModule ],
  templateUrl: './decision-check.component.html',
  styleUrl: './decision-check.component.css'
})
export class DecisionCheckComponent {
  updatingDecisions: { [key: number]: boolean } = {};
  decisiones: Decision[] = [];
  areas: Decision[] = [];

  constructor( private decisionesDBService: DecisionesDBService ) {
  this.decisiones = [];
  }

  ngOnInit(): void {
    this.decisionesDBService.getItems().subscribe((decisiones : Decision[]) => {
      this.areas = decisiones
      this.decisiones = decisiones.map(decision => ({ ...decision, seleccionado: false }));
    });

  }
  onCheckboxChange(decision: Decision, event: any): void {
    const checkbox = event.target as HTMLInputElement;
    const isChecked = checkbox.checked;
    const decisionId = decision.id!;

    this.updatingDecisions[decisionId] = true;

    this.decisionesDBService.updateImportantStatus(decisionId, isChecked)
      .pipe(
        catchError(error => {
          console.error('Error al actualizar el estado de importancia:', error);
          checkbox.checked = !isChecked;
          return EMPTY;
        }),
        switchMap(() => this.decisionesDBService.getItems())
      )
      .subscribe({
        next: (decisiones: Decision[]) => {
          this.decisiones = decisiones.map(d => ({
            ...d,
            seleccionado: false
          }));
          delete this.updatingDecisions[decisionId];
        },
        error: (error) => {
          console.error('Error al obtener las decisiones actualizadas:', error);
          delete this.updatingDecisions[decisionId];
        }
      });
  }
}
