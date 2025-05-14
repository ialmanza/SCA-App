import { Component, Input, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import 'flowbite';
import { DecisionAreaService } from '../../../services/supabaseServices/decision-area.service';
import { NotificationService } from '../../../services/supabaseServices/notification.service';
import { NotificationsComponent } from "../../notifications/notifications.component";
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-crear-decision',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule, NotificationsComponent],
  providers: [DecisionAreaService],
  templateUrl: './crear-decision.component.html',
  styleUrl: './crear-decision.component.css'
})
export class CrearDecisionComponent implements OnInit {
  @Input() projectId: string = '';
  rotuloValue: string = '';
  isLoading: boolean = false;
  projectIdConfirmed: boolean = false;

  constructor(
    private decisionAreaService: DecisionAreaService,
    private notificationService: NotificationService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.loadProjectId();
  }

  private loadProjectId() {
    if (this.projectId && this.projectId.trim() !== '') {
      console.log('ProjectId recibido como Input:', this.projectId);
      this.projectIdConfirmed = true;
      return;
    }

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.projectId = params['id'];
        console.log('ProjectId obtenido de params:', this.projectId);
        this.projectIdConfirmed = true;
        return;
      }

      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.projectId = id;
        console.log('ProjectId obtenido de paramMap:', this.projectId);
        this.projectIdConfirmed = true;
        return;
      }

      this.route.queryParams.subscribe(queryParams => {
        if (queryParams['projectId']) {
          this.projectId = queryParams['projectId'];
          console.log('ProjectId obtenido de queryParams:', this.projectId);
          this.projectIdConfirmed = true;
        } else {
          console.warn('No se encontró projectId en ninguna fuente');
          this.projectIdConfirmed = false;
        }
      });
    });
  }

  async addDecision(area: HTMLInputElement, descripcion: HTMLTextAreaElement) {
    if (!this.projectId || this.projectId.trim() === '' || !this.isValidUUID(this.projectId)) {
      console.error('ID del proyecto no válido o no encontrado:', this.projectId);
      alert('Error: No se pudo determinar el ID del proyecto');
      return;
    }

    console.log('Intentando crear decisión con projectId:', this.projectId);

    if (!area.value || !descripcion.value) {
      alert('Por favor rellene todos los campos.');
      return;
    }

    if (this.isLoading) return;
    this.isLoading = true;

    try {
      await this.decisionAreaService.createDecisionArea(this.projectId, {
        rotulo: this.rotuloValue,
        nombre_area: area.value,
        descripcion: descripcion.value,
        is_important: false
      });

      area.value = '';
      this.rotuloValue = '';
      descripcion.value = '';

      await this.createSuccessNotification('Área de decisión creada correctamente');
    } catch (error) {
      console.error('Error al crear decisión:', error);
      alert('Error al crear el área de decisión');
    } finally {
      this.isLoading = false;
    }
  }

  private async createSuccessNotification(message: string) {
    try {
      if (!this.isValidUUID(this.projectId)) {
        console.error('No se puede crear notificación: ID inválido', this.projectId);
        return;
      }

      console.log('Enviando notificación con projectId:', this.projectId);

      await this.notificationService.createNotification({
        project_id: this.projectId,
        message: message,
        type: 'success'
      });
    } catch (error) {
      console.error('Error al crear notificación:', error);
    }
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}
