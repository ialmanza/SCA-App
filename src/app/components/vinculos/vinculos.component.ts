import { Component } from '@angular/core';
import { GrafoComponent } from "../grafo/grafo.component";
import { FormsModule } from '@angular/forms';
import { Decision } from '../../models/decision';
import { CommonModule } from '@angular/common';
import { VinculodbService } from '../../services/_Vinculos/vinculodb.service';
import { DecisionesDBService } from '../../services/_Decisiones/decisiones-db.service';
import { NotificationService } from '../../services/_Notification/notification.service';
import { NotificationsComponent } from "../notifications/notifications.component";

interface Vinculo {
  nombre: string;
  area_id: number;
  related_area_id: number;
}

@Component({
  selector: 'app-vinculos',
  standalone: true,
  imports: [GrafoComponent, FormsModule, CommonModule, NotificationsComponent],
  providers: [DecisionesDBService, VinculodbService],
  templateUrl: './vinculos.component.html',
  styleUrl: './vinculos.component.css'
})
export class VinculosComponent {
  selectedArea1: Decision | null = null;
  selectedArea2: Decision | null = null;
  areas: Decision[] = [];
  vinculos: Vinculo[] = [];
  decisiones: Decision[];

  constructor(
    private decisionesDBService: DecisionesDBService,
    private vinculodbService: VinculodbService,
    private notificationservice: NotificationService
  ) {
    this.decisiones = [];
  }

  ngOnInit(): void {
    this.decisionesDBService.getItems().subscribe((decisiones: Decision[]) => {
      this.areas = decisiones;
      this.decisiones = decisiones.map(decision => ({ ...decision, seleccionado: false }));
    });

    this.cargarVinculos();
  }

  cargarVinculos(): void {
    this.vinculodbService.getItems().subscribe((response: any) => {
      this.vinculos = response.vinculos.map((vinculo: any[]) => ({
        nombre: vinculo[0],
        area_id: vinculo[1],
        related_area_id: vinculo[2]
      }));

    }, error => {
      this.notificationservice.show('Error al cargar vínculos', 'error');
      this.vinculos = [];
    });
  }

  crearVinculo(): void {
    if (this.selectedArea1 && this.selectedArea2 && this.selectedArea1 !== this.selectedArea2) {
      const area_id = this.selectedArea1.id!;
      const related_area_id = this.selectedArea2.id!;
      this.vinculodbService.createItem(area_id, related_area_id).subscribe(() => {
        this.cargarVinculos();
        this.selectedArea1 = null;
        this.selectedArea2 = null;
      }, error => {
        this.notificationservice.show('Error al crear vínculo', 'error');
      });
    } else {
      this.notificationservice.show('Áreas no válidas para crear un vínculo', 'error');
    }
  }

  eliminarVinculo(vinculo: Vinculo): void {
    this.vinculodbService.deleteItem(
      vinculo.area_id,
      vinculo.related_area_id
    ).subscribe(() => {
      this.cargarVinculos();
    }, error => {
      this.notificationservice.show('Error al eliminar vínculo', 'error');
    });
  }
}
