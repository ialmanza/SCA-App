import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CrearDecisionComponent } from "../crear-decision/crear-decision.component";
import { Decision } from '../../../models/decision';
import { Opcion } from '../../../models/opcion';
import { MatDialog } from '@angular/material/dialog';
import { GrafoComponent } from "../../grafo/grafo.component";
import { PosiblesAlternativasComponent } from "../../posibles-alternativas/posibles-alternativas.component";
import { ModoDeComparacionComponent } from "../../modo-de-comparacion/modo-de-comparacion.component";
import { TablaDeComparacionComponent } from "../../tabla-de-comparacion/tabla-de-comparacion.component";
import { DecisionesDBService } from '../../../services/_Decisiones/decisiones-db.service';
import { catchError, EMPTY, switchMap } from 'rxjs';
import { OpcionesDBService } from '../../../services/_Opciones/opciones-db.service';
import { TablaDecisionesComponent } from "../tabla-decisiones/tabla-decisiones.component";
import { DecisionCheckComponent } from "../decision-check/decision-check.component";
import { VinculodbService } from '../../../services/_Vinculos/vinculodb.service';
import { VinculosComponent } from "../../vinculos/vinculos.component";
import { PuntuacionesMinimasComponent } from "../../puntuaciones-minimas/puntuaciones-minimas.component";
import { TablaDeSeleccionComponent } from "../../tabla-de-seleccion/tabla-de-seleccion.component";
import { UltimopasoComponent } from "../../ultimopaso/ultimopaso.component";
import { NotificationService } from '../../../services/_Notification/notification.service';
import { NotificationsComponent } from "../../notifications/notifications.component";



@Component({
  selector: 'app-decisiones-form',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule, CrearDecisionComponent,
    GrafoComponent, PosiblesAlternativasComponent, ModoDeComparacionComponent, TablaDeComparacionComponent, TablaDecisionesComponent, DecisionCheckComponent, VinculosComponent, PuntuacionesMinimasComponent, TablaDeSeleccionComponent, UltimopasoComponent, NotificationsComponent],
  providers: [ DecisionesDBService, OpcionesDBService, VinculodbService],
  templateUrl: './decisiones-form.component.html',
  styleUrl: './decisiones-form.component.css'
})
export class DecisionesFormComponent {
  pasoActual: number = 1;
  decisiones: Decision[];
  opciones: Opcion[];
  rotuloValue: any;
  areasSeleccionadas: Decision[] = [];
  nuevaDescripcion: string = '';
  modalAbierto: boolean = false;
  decisionSeleccionada: Decision | null = null;
  opcionSeleccionada: Opcion | null = null;
  modalEditarDecisionAbierto: boolean = false;
  modalEliminarDecisionAbierto: boolean = false;
  areas: Decision[] = [];
  vinculos: string[] = [];
  selectedArea1: Decision | null = null;
  selectedArea2: Decision | null = null;
  updatingDecisions: { [key: number]: boolean } = {};

  constructor( public dialog: MatDialog, private decisionesDBService: DecisionesDBService
    , private opcionesDBService: OpcionesDBService, private vinculodbService: VinculodbService,
      private notificationservice: NotificationService) {
    this.decisiones = [];
    this.opciones = [];
  }

  ngOnInit(): void {
    this.decisionesDBService.getItems().subscribe((decisiones: Decision[]) => {
      this.areas = decisiones
      this.decisiones = decisiones.map(decision => ({ ...decision, seleccionado: false }));
    });

    this.opcionesDBService.getItems().subscribe((opciones: Opcion[]) => {
      this.opciones = opciones;
    })
    this.eliminarVinculos();

    this.vinculodbService.getItems().subscribe((vinculos: string[]) => {
      this.vinculos = vinculos;
    });
  }

  eliminarVinculos(): void {
    this.vinculos = [];
  }

  crearVinculo(): void {
    if (this.selectedArea1 && this.selectedArea2 && this.selectedArea1 !== this.selectedArea2) {
      const area_id = this.selectedArea1.id!;
      const related_area_id = this.selectedArea2.id!;

      this.vinculodbService.createItem(area_id, related_area_id).subscribe(() => {
        this.selectedArea1 = null;
        this.selectedArea2 = null;
      });


    } else {
      this.notificationservice.show('Áreas no válidas para crear un vínculo', 'error');
    }
  }

  deleteDecision(decisiones: Decision) {

    this.decisionesDBService.deleteItem(decisiones.id!)
      .pipe(
        catchError(error => {
          this.notificationservice.show('Error al eliminar la decisión', 'error');
          return EMPTY;
        }),
        switchMap(() => this.decisionesDBService.getItems())
      )
      .subscribe({
        next: (decisiones: Decision[]) => {
          this.decisiones = decisiones.map(decision => ({ ...decision, seleccionado: false }));
          this.cerrarModalEliminarDecision();
        },
        error: (error) => {
          this.notificationservice.show('Error al obtener las decisiones actualizadas', 'error');
        }
      });
  }

  updateDecision(updatedDecision: Decision) {
    this.decisionesDBService.updateItem(updatedDecision.id!, updatedDecision)
      .pipe(
        switchMap(() => this.decisionesDBService.getItems()),
        catchError(error => {
          this.notificationservice.show('Error al actualizar u obtener las decisiones', 'error');
          return EMPTY;
        })
      )
      .subscribe({
        next: (decisiones: Decision[]) => {
          this.decisiones = decisiones.map(decision => ({ ...decision, seleccionado: false }));
          this.cerrarModal();
          this.cerrarModalEditarDecision();
          this.notificationservice.show('¡Decisión guardada correctamente!', 'success');

        },
        error: (error: any) => {
          this.notificationservice.show('Error al guardar la decisión', 'error');
        }
      });
  }


  avanzarPaso() {
    if (this.pasoActual < 20) {
      this.pasoActual++;

    }
  }

  retrocederPaso() {
    if (this.pasoActual > 1) {
      this.pasoActual--;

    }
  }

  getOpcionesPorArea(areaId: number) {
    return this.opciones.filter(opcion => opcion.cod_area.toString() === areaId.toString());

  }

  onCheckboxChange(decision: Decision, event: any): void {
    const checkbox = event.target as HTMLInputElement;
    const isChecked = checkbox.checked;
    const decisionId = decision.id!;

    this.updatingDecisions[decisionId] = true;

    this.decisionesDBService.updateImportantStatus(decisionId, isChecked)
      .pipe(
        catchError(error => {
          this.notificationservice.show('Error al actualizar el estado de importancia', 'error');
          checkbox.checked = !isChecked;
          return EMPTY;
        }),
        switchMap(() => this.decisionesDBService.getItems())
      )
      .subscribe({
        next: (decisiones: Decision[]) => {
          this.decisiones = decisiones.map(d => ({
            ...d,
            seleccionado: false
          }));
          delete this.updatingDecisions[decisionId];
        },
        error: (error) => {
          this.notificationservice.show('Error al obtener las decisiones actualizadas', 'error');
          delete this.updatingDecisions[decisionId];
        }
      });
  }

  //CRUD PARA LAS OPCIONES DENTRO DE LAS DECISIONES
  agregarOpcion() {
    if (!this.nuevaDescripcion.trim()) {
      this.notificationservice.show('Por favor, ingresa una descripción valida.', 'error');
      return;
    }

    const nuevaOpcion: Opcion = {
      _id: Date.now().toString(),
      descripcion: this.nuevaDescripcion,
      cod_area: this.decisionSeleccionada?.id?.toString() ?? ''
    };

    this.opcionesDBService.createItem(nuevaOpcion).subscribe(() => {
      this.opcionesDBService.getItems().subscribe((opcionesActualizadas) => {
        this.opciones = opcionesActualizadas;
      });
    });

    this.cerrarModal();
  }

  deleteOpcion(opcion: Opcion) {
    this.opcionesDBService.deleteItem(opcion.id!).subscribe({
      next: () => {
        this.notificationservice.show('¡Opción eliminada correctamente!', 'success');
        this.loadOpciones();
      },
      error: (err) => {
        this.notificationservice.show('Error al eliminar la opcion', 'error');
      },
    });
  }

  loadOpciones() {
    this.opcionesDBService.getItems().subscribe({
      next: (opciones) => {
        this.opciones = opciones;
      },
      error: (err) => {
        this.notificationservice.show('Error al cargar las opciones', 'error');
      },
    });
  }

  abrirModal(decision: Decision) {
    this.decisionSeleccionada = decision;
    this.modalAbierto = true;
  }

  abrirModalEditarDecision(decision: Decision) {
    this.decisionSeleccionada = decision;
    this.modalEditarDecisionAbierto = true;
  }

  abrirModalEliminarDecision(decision: Decision) {
    this.decisionSeleccionada = decision;
    this.modalEliminarDecisionAbierto = true;
  }

  cerrarModal() {
    this.modalAbierto = false;
    this.nuevaDescripcion = '';
  }

  cerrarModalEditarDecision() {
    this.modalEditarDecisionAbierto = false;
    this.nuevaDescripcion = '';
  }

  cerrarModalEliminarDecision() {
    this.modalEliminarDecisionAbierto = false;
    this.nuevaDescripcion = '';
  }

  getImportantStatusArea() {
    this.decisionesDBService.getImportantStatus().subscribe((decisionesActualizadas) => {
      this.areasSeleccionadas = decisionesActualizadas;
    })
    this.avanzarPaso();
  }

  recargarpagina() {
    this.avanzarPaso();
    window.location.reload(); //REACARGA LA PAGINA
  }
}
