import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsComponent } from "../../notifications/notifications.component";
import { DecisionAreaService } from '../../../services/supabaseServices/decision-area.service';
import { NotificationService } from '../../../services/supabaseServices/notification.service';
import { DecisionArea } from '../../../models/interfaces';

@Component({
  selector: 'app-decision-check',
  standalone: true,
  imports: [CommonModule, NotificationsComponent],
  templateUrl: './decision-check.component.html',
  styleUrl: './decision-check.component.css'
})
export class DecisionCheckComponent implements OnInit {
  @Input() projectId!: string;

  updatingDecisions: { [key: string]: boolean } = {};
  decisionAreas: DecisionArea[] = [];

  constructor(
    private decisionAreaService: DecisionAreaService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadDecisionAreas();
  }

  private loadDecisionAreas(): void {
    this.decisionAreaService.getDecisionAreasByProject(this.projectId)
      .then(areas => {
        this.decisionAreas = areas;
      })
      .catch(error => {
        this.createNotification('Error al cargar las áreas de decisión', 'error');
        console.error('Error loading decision areas:', error);
      });
  }

  async onCheckboxChange(area: DecisionArea, event: any): Promise<void> {
    const checkbox = event.target as HTMLInputElement;
    const isChecked = checkbox.checked;
    const areaId = area.id;

    this.updatingDecisions[areaId] = true;

    try {
      await this.decisionAreaService.updateDecisionArea(areaId, { is_important: isChecked });
      await this.loadDecisionAreas();
      this.createNotification('Estado de importancia actualizado correctamente', 'success');
    } catch (error) {
      this.createNotification('Error al actualizar el estado de importancia', 'error');
      checkbox.checked = !isChecked;
      console.error('Error updating importance status:', error);
    } finally {
      delete this.updatingDecisions[areaId];
    }
  }

  private createNotification(message: string, type: 'success' | 'error' | 'info'): void {
    if (!this.projectId) {
      console.error('No hay projectId disponible para crear notificación');
      return;
    }

    this.notificationService.createNotification({
      project_id: this.projectId,
      message: message,
      type: type
    }).catch(error => {
      console.error('Error al crear notificación:', error);
    });
  }
}
