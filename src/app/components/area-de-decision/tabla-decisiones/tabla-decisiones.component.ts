import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Decision } from '../../../models/decision';
import { FormsModule, ReactiveFormsModule} from '@angular/forms';
import { catchError, EMPTY, switchMap } from 'rxjs';
import { NotificationService } from '../../../services/_Notification/notification.service';
import { DecisionsService } from '../../../services/supabaseServices/decisions.service';

@Component({
  selector: 'app-tabla-decisiones',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  providers: [DecisionsService],
  templateUrl: './tabla-decisiones.component.html',
  styleUrl: './tabla-decisiones.component.css'
})
export class TablaDecisionesComponent {
  @Input() projectId!: string;
  decisiones: Decision[];
  modalAbierto: boolean = false;
  modalEliminarDecisionAbierto: boolean = false;
  decisionSeleccionada: Decision | null = null;
  nuevaDescripcion: string = '';
  modalEditarDecisionAbierto: boolean = false;
  areas: Decision[] = [];

  constructor(
    private decisionsService: DecisionsService,
    private notificationservice: NotificationService
  ) {
    this.decisiones = [];
  }

  ngOnInit(): void {
    if (!this.projectId) {
      this.notificationservice.show('Error: No se ha especificado el proyecto', 'error');
      return;
    }

    this.decisionsService.getDecisionsByProject(this.projectId).subscribe({
      next: (decisiones: Decision[]) => {
        this.areas = decisiones;
        this.decisiones = decisiones.map(decision => ({ ...decision, seleccionado: false }));
      },
      error: (error) => {
        this.notificationservice.show('Error al cargar las decisiones', 'error');
      }
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
    this.decisionsService.updateDecision(updatedDecision.id, {
      rotulo: updatedDecision.rotulo,
      nombre_area: updatedDecision.nombre_area,
      descripcion: updatedDecision.descripcion,
      is_important: updatedDecision.is_important
    })
      .pipe(
        catchError(error => {
          this.notificationservice.show('Error al actualizar la decisión', 'error');
          return EMPTY;
        }),
        switchMap(() => this.decisionsService.getDecisionsByProject(this.projectId))
      )
      .subscribe({
        next: (decisiones: Decision[]) => {
          this.decisiones = decisiones.map(decision => ({ ...decision, seleccionado: false }));
          this.cerrarModal();
          this.cerrarModalEditarDecision();
        },
        error: (error: any) => {
          this.notificationservice.show('Error al obtener las decisiones actualizadas', 'error');
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

  deleteDecision(decision: Decision) {
    this.decisionsService.deleteDecision(decision.id)
      .pipe(
        catchError(error => {
          this.notificationservice.show('Error al eliminar la decisión', 'error');
          return EMPTY;
        }),
        switchMap(() => this.decisionsService.getDecisionsByProject(this.projectId))
      )
      .subscribe({
        next: (decisiones: Decision[]) => {
          this.decisiones = decisiones.map(decision => ({ ...decision, seleccionado: false }));
          this.cerrarModalEliminarDecision();
        },
        error: (error) => {
          this.notificationservice.show('Error al obtener las decisiones actualizadas', 'error');
        }
      });
  }
}
