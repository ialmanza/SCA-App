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
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-vinculos',
  standalone: true,
  imports: [GrafoComponent, FormsModule, CommonModule, NotificationsComponent, TranslateModule],
  providers: [DecisionsService, VinculosService],
  templateUrl: './vinculos.component.html',
  styleUrl: './vinculos.component.css'
})

export class VinculosComponent implements OnInit {
  selectedArea1: Decision | null = null;
  selectedAreas2: Decision[] = [];
  areas: Decision[] = [];
  vinculos: Vinculo[] = [];
  vinculoAEliminar: Vinculo | null = null;
  decisiones: Decision[] = [];
  showDropdown: boolean = false;
  @Input() projectId!: string;

  constructor(
    private decisionsService: DecisionsService,
    private vinculosService: VinculosService,
    private notificationservice: NotificationService,
    private translationService: TranslationService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    if (this.projectId) {
      this.loadData();
    } else {
      this.notificationservice.show(this.translate.instant('vinculos.notifications.noProjectId'), 'error');
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
        this.notificationservice.show(this.translate.instant('vinculos.notifications.errorLoadingAreas'), 'error');
      }
    });
  }

  cargarVinculos(): void {
    this.vinculosService.getVinculosByProject(this.projectId).then((vinculos: Vinculo[]) => {
      this.vinculos = vinculos;
    }).catch(error => {
      this.notificationservice.show(this.translate.instant('vinculos.notifications.errorLoadingLinks'), 'error');
      this.vinculos = [];
    });
  }

  toggleAreaSelection(area: Decision): void {
    const index = this.selectedAreas2.findIndex(selected => selected.id === area.id);
    if (index > -1) {
      this.selectedAreas2.splice(index, 1);
    } else {
      this.selectedAreas2.push(area);
    }
  }

  isAreaSelected(area: Decision): boolean {
    return this.selectedAreas2.some(selected => selected.id === area.id);
  }

  getAvailableDestinationAreas(): Decision[] {
    return this.areas.filter(area => area.id !== this.selectedArea1?.id);
  }

  getSelectedAreasText(): string {
    if (this.selectedAreas2.length === 0) {
      return this.translate.instant('vinculos.form.selectDestinations');
    }
    if (this.selectedAreas2.length === 1) {
      return this.selectedAreas2[0].nombre_area;
    }
    return `${this.selectedAreas2.length} ${this.translate.instant('vinculos.form.selectedCount')}`;
  }

  vinculoExiste(area1Id: string, area2Id: string): boolean {
    return this.vinculos.some(vinculo =>
      (vinculo.area_id === area1Id && vinculo.related_area_id === area2Id) ||
      (vinculo.area_id === area2Id && vinculo.related_area_id === area1Id)
    );
  }

  tieneVinculoConOrigen(area: Decision): boolean {
    if (!this.selectedArea1) return false;
    return this.vinculoExiste(this.selectedArea1.id, area.id);
  }

  crearVinculo(): void {
    if (this.selectedArea1 && this.selectedAreas2.length > 0) {
      const area_id = this.selectedArea1.id;
      const promises: Promise<any>[] = [];
      const vinculosExistentes: string[] = [];
      const vinculosNuevos: string[] = [];

      this.selectedAreas2.forEach(area2 => {
        if (area2.id !== area_id) {
          if (this.vinculoExiste(area_id, area2.id)) {
            vinculosExistentes.push(`${this.selectedArea1!.nombre_area} ↔ ${area2.nombre_area}`);
          } else {
            vinculosNuevos.push(`${this.selectedArea1!.nombre_area} → ${area2.nombre_area}`);
            promises.push(
              this.vinculosService.createVinculo(this.projectId, area_id, area2.id)
            );
          }
        }
      });

      if (vinculosExistentes.length > 0) {
        this.notificationservice.show(
          `${this.translate.instant('vinculos.notifications.linksAlreadyExist')}: ${vinculosExistentes.join(', ')}`,
          'info'
        );
      }

      if (promises.length > 0) {
        Promise.all(promises)
          .then(() => {
            let mensaje = this.translate.instant('vinculos.notifications.linksCreatedSuccess', { count: promises.length });
            if (vinculosExistentes.length > 0) {
              mensaje += ` ${this.translate.instant('vinculos.notifications.someAlreadyExisted', { count: vinculosExistentes.length })}`;
            }
            this.notificationservice.show(mensaje, 'success');
            this.cargarVinculos();
            this.selectedArea1 = null;
            this.selectedAreas2 = [];
            this.showDropdown = false;
          })
          .catch(error => {
            this.notificationservice.show(this.translate.instant('vinculos.notifications.errorCreatingLinks'), 'error');
          });
      } else if (vinculosExistentes.length > 0 && vinculosNuevos.length === 0) {
        this.selectedArea1 = null;
        this.selectedAreas2 = [];
        this.showDropdown = false;
      }
    } else {
      this.notificationservice.show(this.translate.instant('vinculos.notifications.selectOriginAndDestination'), 'error');
    }
  }

  eliminarVinculo(vinculo: Vinculo): void {
    this.vinculosService.deleteVinculo(vinculo.id)
      .then(() => {
        this.cargarVinculos();
      })
      .catch(error => {
        this.notificationservice.show(this.translate.instant('vinculos.notifications.errorDeletingLink'), 'error');
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

  clearDestinationSelection(): void {
    this.selectedAreas2 = [];
  }
}
