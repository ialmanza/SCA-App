import { Component, Input, OnInit } from '@angular/core';
import { GrafoComponent } from "../grafo/grafo.component";
import { FormsModule } from '@angular/forms';
import { Decision } from '../../models/decision';
import { CommonModule } from '@angular/common';
import { VinculosService } from '../../services/supabaseServices/vinculos.service';
import { DecisionsService } from '../../services/supabaseServices/decisions.service';
import { NotificationService } from '../../services/_Notification/notification.service';
import { NotificationsComponent } from "../notifications/notifications.component";
import { Vinculo } from '../../models/interfaces';

@Component({
  selector: 'app-vinculos',
  standalone: true,
  imports: [GrafoComponent, FormsModule, CommonModule, NotificationsComponent],
  providers: [DecisionsService, VinculosService],
  templateUrl: './vinculos.component.html',
  styleUrl: './vinculos.component.css'
})
export class VinculosComponent implements OnInit {
  selectedArea1: Decision | null = null;
  selectedArea2: Decision | null = null;
  areas: Decision[] = [];
  vinculos: Vinculo[] = [];
  vinculoAEliminar: Vinculo | null = null;
  decisiones: Decision[] = [];
  @Input() projectId!: string;

  constructor(
    private decisionsService: DecisionsService,
    private vinculosService: VinculosService,
    private notificationservice: NotificationService
  ) {}

  ngOnInit(): void {
    if (this.projectId) {
      this.loadData();
    } else {
      this.notificationservice.show('No se encontró el ID del proyecto', 'error');
    }
  }

  private loadData(): void {
    this.decisionsService.getDecisionsByProject(this.projectId).subscribe({
      next: (decisiones: Decision[]) => {
        this.areas = decisiones;
        this.decisiones = decisiones.map(decision => ({ ...decision, seleccionado: false }));
        this.cargarVinculos();
      },
      error: (error) => {
        this.notificationservice.show('Error al cargar áreas de decisión', 'error');
      }
    });
  }

  cargarVinculos(): void {
    this.vinculosService.getVinculosByProject(this.projectId).then((vinculos: Vinculo[]) => {
      this.vinculos = vinculos;
    }).catch(error => {
      this.notificationservice.show('Error al cargar vínculos', 'error');
      this.vinculos = [];
    });
  }

  crearVinculo(): void {
    if (this.selectedArea1 && this.selectedArea2 && this.selectedArea1 !== this.selectedArea2) {
      const area_id = this.selectedArea1.id;
      const related_area_id = this.selectedArea2.id;

      this.vinculosService.createVinculo(this.projectId, area_id, related_area_id)
        .then(() => {
          this.cargarVinculos();
          this.selectedArea1 = null;
          this.selectedArea2 = null;
        })
        .catch(error => {
          this.notificationservice.show('Error al crear vínculo', 'error');
        });
    } else {
      this.notificationservice.show('Áreas no válidas para crear un vínculo', 'error');
    }
  }

  eliminarVinculo(vinculo: Vinculo): void {
    this.vinculosService.deleteVinculo(vinculo.id)
      .then(() => {
        this.cargarVinculos();
      })
      .catch(error => {
        this.notificationservice.show('Error al eliminar vínculo', 'error');
      });
  }

  mostrarConfirmacion(vinculo: Vinculo): void {
    this.vinculoAEliminar = vinculo;
  }

  cancelarEliminacion(): void {
    this.vinculoAEliminar = null;
  }

  confirmarEliminacion(): void {
    if (this.vinculoAEliminar) {
      this.eliminarVinculo(this.vinculoAEliminar);
      this.vinculoAEliminar = null;
    }
  }
}
