import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OpcionesDBService } from '../../../services/_Opciones/opciones-db.service';
import { DecisionesDBService } from '../../../services/_Decisiones/decisiones-db.service';
import { NotificationsComponent } from "../../notifications/notifications.component";
import { NotificationService } from '../../../services/_Notification/notification.service';

@Component({
  selector: 'app-crear-opcion',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule, NotificationsComponent],
  providers: [ OpcionesDBService, DecisionesDBService ],
  templateUrl: './crear-opcion.component.html',
  styleUrl: './crear-opcion.component.css'
})
export class CrearOpcionComponent {
  areasDecisiones: any[] = [];
  selectedAreaId: string = '';

    constructor(  private decisionDbService :DecisionesDBService,
                 private opcionDbService:  OpcionesDBService,
                 private notificationservice: NotificationService
     ) {
      this.decisionDbService.getItems().subscribe((data: any[]) => {
        this.areasDecisiones = data;
      })
    }

    addOpcion(opcion : HTMLInputElement) {
      if (!this.selectedAreaId) {
        this.notificationservice.show('Por favor selecciona un área de decisión.', 'error');
        opcion.value = '';
        return false;
      }
      const id = Date.now().toString();
       this.opcionDbService.createItem({
        _id: id,
        descripcion: opcion.value,
        cod_area: this.selectedAreaId
      }).subscribe(() => {
      opcion.value = '';
      this.selectedAreaId = '';
    });
    return false;
  }
}
