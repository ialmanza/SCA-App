import { Component, Input, OnInit } from '@angular/core';
import { Opcion } from '../../../models/interfaces';
import { OpcionesService } from '../../../services/supabaseServices/opciones.service';
import { NotificationService } from '../../../services/supabaseServices/notification.service';
import { NotificationsComponent } from "../../notifications/notifications.component";

@Component({
  selector: 'app-opcion',
  standalone: true,
  imports: [NotificationsComponent],
  templateUrl: './opcion.component.html',
  styleUrl: './opcion.component.css'
})
export class OpcionComponent implements OnInit {
  @Input() opciones!: Opcion;
  @Input() projectId!: string;
  editing: boolean = false;

  constructor(
    private opcionesService: OpcionesService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.opcionesService.loadOpciones();
  }

  async deleteOpcion(opcion: Opcion) {
    if (!opcion.id) return;

    if (confirm('¿Estás seguro de que deseas eliminar esta opción?')) {
      try {
        await this.opcionesService.deleteOpcion(opcion.id.toString());
        this.notificationService.createNotification({
          project_id: this.projectId,
          message: '¡Opción eliminada correctamente!',
          type: 'success'
        });
      } catch (error) {
        this.notificationService.createNotification({
          project_id: this.projectId,
          message: 'Error al eliminar la opción',
          type: 'error'
        });
      }
    }
  }
}
