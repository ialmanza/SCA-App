import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import 'flowbite';
import { DecisionesDBService } from '../../../services/_Decisiones/decisiones-db.service';
import { NotificationService } from '../../../services/_Notification/notification.service';
import { NotificationsComponent } from "../../notifications/notifications.component";

@Component({
  selector: 'app-crear-decision',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule, NotificationsComponent],
  providers: [ DecisionesDBService],
  templateUrl: './crear-decision.component.html',
  styleUrl: './crear-decision.component.css'
})
export class CrearDecisionComponent {
rotuloValue: any;

  constructor( private decisionesDBService: DecisionesDBService, private notificationservice: NotificationService) {}

  addDecision( area:HTMLInputElement, descripcion:HTMLTextAreaElement) {
    if (!area.value || !descripcion.value) {
      this.notificationservice.show('Por favor rellene todos los campos.', 'error');
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
