import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DecisionesDBService } from '../../../services/_Decisiones/decisiones-db.service';
import { Decision } from '../../../models/decision';
import { FormsModule, ReactiveFormsModule} from '@angular/forms';
import { catchError, EMPTY, switchMap } from 'rxjs';

@Component({
  selector: 'app-tabla-decisiones',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  providers: [DecisionesDBService],
  templateUrl: './tabla-decisiones.component.html',
  styleUrl: './tabla-decisiones.component.css'
})
export class TablaDecisionesComponent {
  decisiones : Decision[];
  modalAbierto: boolean = false;
  modalEliminarDecisionAbierto: boolean = false;
  decisionSeleccionada: Decision | null = null;
  nuevaDescripcion: string = '';
  modalEditarDecisionAbierto: boolean = false;
  areas: Decision[] = [];

  constructor(  private decisionesDBService: DecisionesDBService) {
  this.decisiones = [];
  }

  ngOnInit(): void {
    this.decisionesDBService.getItems().subscribe((decisiones : Decision[]) => {
      this.areas = decisiones
      this.decisiones = decisiones.map(decision => ({ ...decision, seleccionado: false }));
    });
  }
  abrirModal(decision: Decision) {
    this.decisionSeleccionada = decision;
    this.modalAbierto = true;
  }

  abrirModalEliminarDecision(decision: Decision) {
    this.decisionSeleccionada = decision;
    this.modalEliminarDecisionAbierto = true;
  }

  cerrarModal() {
    this.modalAbierto = false;
    this.nuevaDescripcion = '';
  }

  updateDecision(updatedDecision: Decision) {
    this.decisionesDBService.updateItem(updatedDecision.id!, updatedDecision)
      .pipe(
        catchError(error => {
          console.error('Error al actualizar la decisión:', error);
          return EMPTY;
        }),
        switchMap(() => this.decisionesDBService.getItems())
      )
      .subscribe({
        next: (decisiones: Decision[]) => {
          this.decisiones = decisiones.map(decision => ({ ...decision, seleccionado: false }));
          this.cerrarModal();
          this.cerrarModalEditarDecision();
        },
        error: (error: any) => {
          console.error('Error al obtener las decisiones actualizadas:', error);
        }
      });
  }

  cerrarModalEditarDecision() {
    this.modalEditarDecisionAbierto = false;
    this.nuevaDescripcion = '';
  }

  cerrarModalEliminarDecision() {
    this.modalEliminarDecisionAbierto = false;
    this.nuevaDescripcion = '';
  }

  deleteDecision(decisiones : Decision) {

    this.decisionesDBService.deleteItem(decisiones.id!)
    .pipe(
      catchError(error => {
        console.error('Error al eliminar la decisión:', error);
        return EMPTY;
      }),
      switchMap(() => this.decisionesDBService.getItems())
    )
    .subscribe({
      next: (decisiones: Decision[]) => {
        this.decisiones = decisiones.map(decision => ({ ...decision, seleccionado: false }));
        this.cerrarModalEliminarDecision();
      },
      error: (error) => {
        console.error('Error al obtener las decisiones actualizadas:', error);
      }
    });
}
}
