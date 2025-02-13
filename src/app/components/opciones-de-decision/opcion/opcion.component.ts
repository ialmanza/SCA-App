import { Component, Input } from '@angular/core';
import { Opcion } from '../../../models/opcion';
import { OpcionesDBService } from '../../../services/_Opciones/opciones-db.service';
import { Observable } from 'rxjs';
import { NotificationService } from '../../../services/_Notification/notification.service';
import { NotificationsComponent } from "../../notifications/notifications.component";

@Component({
  selector: 'app-opcion',
  standalone: true,
  imports: [NotificationsComponent],
  providers: [OpcionesDBService],
  templateUrl: './opcion.component.html',
  styleUrl: './opcion.component.css'
})
export class OpcionComponent {
  @Input() opciones!: Opcion
  editing: boolean = false;


  constructor( private opcionesDBService: OpcionesDBService, private notificationservice: NotificationService) {}

  deleteOpcion(opcion: Opcion) {
        this.opcionesDBService.deleteItem(opcion.id!).subscribe({
          next: () => {
            this.notificationservice.show('¡Opción eliminada correctamente!', 'success');
            this.opcionesDBService.getItems();
          },
          error: (err) => {
            this.notificationservice.show('Error al eliminar la opcion', 'error');
          },
        });
      }



}
