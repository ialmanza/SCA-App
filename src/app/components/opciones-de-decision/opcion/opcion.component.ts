import { Component, Input, OnInit } from '@angular/core';
import { Opcion } from '../../../models/interfaces';
import { OpcionesService } from '../../../services/supabaseServices/opciones.service';
import { NotificationService } from '../../../services/supabaseServices/notification.service';
import { NotificationsComponent } from "../../notifications/notifications.component";
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-opcion',
  standalone: true,
  imports: [NotificationsComponent],
  templateUrl: './opcion.component.html',
  styleUrl: './opcion.component.css'
})
export class OpcionComponent implements OnInit {
  @Input() opciones!: Opcion;
  editing: boolean = false;
  projectId: string = '';

  constructor(
    private opcionesService: OpcionesService,
    private notificationService: NotificationService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Obtener el ID del proyecto de la ruta
    this.route.params.subscribe(params => {
      this.projectId = params['id'];
    });
    // Cargar las opciones al iniciar el componente
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
