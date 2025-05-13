import { DecisionsService } from './../../../services/supabaseServices/decisions.service';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CrearDecisionComponent } from "../crear-decision/crear-decision.component";
import { DecisionArea } from '../../../models/interfaces';
import { Opcion } from '../../../models/interfaces';
import { MatDialog } from '@angular/material/dialog';
import { GrafoComponent } from "../../grafo/grafo.component";
import { PosiblesAlternativasComponent } from "../../posibles-alternativas/posibles-alternativas.component";
import { ModoDeComparacionComponent } from "../../modo-de-comparacion/modo-de-comparacion.component";
import { TablaDeComparacionComponent } from "../../tabla-de-comparacion/tabla-de-comparacion.component";
import { DecisionAreaService } from '../../../services/supabaseServices/decision-area.service';
import { OpcionesService } from '../../../services/supabaseServices/opciones.service';
import { TablaDecisionesComponent } from "../tabla-decisiones/tabla-decisiones.component";
import { DecisionCheckComponent } from "../decision-check/decision-check.component";
import { VinculosService } from '../../../services/supabaseServices/vinculos.service';
import { VinculosComponent } from "../../vinculos/vinculos.component";
import { PuntuacionesMinimasComponent } from "../../puntuaciones-minimas/puntuaciones-minimas.component";
import { TablaDeSeleccionComponent } from "../../tabla-de-seleccion/tabla-de-seleccion.component";
import { UltimopasoComponent } from "../../ultimopaso/ultimopaso.component";
import { NotificationService } from '../../../services/supabaseServices/notification.service';
import { NotificationsComponent } from "../../notifications/notifications.component";
import { ActivatedRoute } from '@angular/router';
import { Vinculo } from '../../../models/interfaces';

@Component({
  selector: 'app-decisiones-form',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule, CrearDecisionComponent,
    GrafoComponent, PosiblesAlternativasComponent, ModoDeComparacionComponent, TablaDeComparacionComponent,
    TablaDecisionesComponent, DecisionCheckComponent, VinculosComponent, PuntuacionesMinimasComponent,
    TablaDeSeleccionComponent, UltimopasoComponent, NotificationsComponent],
  templateUrl: './decisiones-form.component.html',
  styleUrl: './decisiones-form.component.css'
})
export class DecisionesFormComponent implements OnInit {
  pasoActual: number = 1;
  decisiones: (DecisionArea & { seleccionado: boolean })[] = [];
  opciones: Opcion[] = [];
  rotuloValue: any;
  areasSeleccionadas: DecisionArea[] = [];
  nuevaDescripcion: string = '';
  modalAbierto: boolean = false;
  decisionSeleccionada: DecisionArea | null = null;
  opcionSeleccionada: Opcion | null = null;
  modalEditarDecisionAbierto: boolean = false;
  modalEliminarDecisionAbierto: boolean = false;
  areas: DecisionArea[] = [];
  vinculos: Vinculo[] = [];
  selectedArea1: DecisionArea | null = null;
  selectedArea2: DecisionArea | null = null;
  updatingDecisions: { [key: string]: boolean } = {};
  projectId: string = '';

  constructor(
    public dialog: MatDialog,
    private decisionAreaService: DecisionAreaService,
    private decisionsService: DecisionsService,
    private opcionesService: OpcionesService,
    private vinculosService: VinculosService,
    private notificationService: NotificationService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (!params['id']) {
        console.error('No se proporcionó un ID de proyecto');
        return;
      }
      this.projectId = params['id'];
      this.loadData();
    });
  }

  async loadData() {
    try {
      // Cargar decisiones
      const decisiones = await this.decisionAreaService.getDecisionAreasByProject(this.projectId);
      this.areas = decisiones;
      this.decisiones = decisiones.map(decision => ({ ...decision, seleccionado: false }));

      // Cargar opciones
      const opciones = await this.opcionesService.getOpcionesByProject(this.projectId);
      this.opciones = opciones;

      // Cargar vínculos
      const vinculos = await this.vinculosService.getVinculosByProject(this.projectId);
      this.vinculos = vinculos;
    } catch (error) {
      this.notificationService.createNotification({
        project_id: this.projectId,
        message: 'Error al cargar los datos',
        type: 'error'
      });
    }
  }

  eliminarVinculos(): void {
    this.vinculos = [];
  }

  async crearVinculo(): Promise<void> {
    if (this.selectedArea1 && this.selectedArea2 && this.selectedArea1 !== this.selectedArea2) {
      try {
        await this.vinculosService.createVinculo(
          this.selectedArea1.id,
          this.selectedArea2.id,
          this.projectId
        );
        this.selectedArea1 = null;
        this.selectedArea2 = null;
        await this.loadData();
      } catch (error) {
        this.notificationService.createNotification({
          project_id: this.projectId,
          message: 'Error al crear el vínculo',
          type: 'error'
        });
      }
    } else {
      this.notificationService.createNotification({
        project_id: this.projectId,
        message: 'Áreas no válidas para crear un vínculo',
        type: 'error'
      });
    }
  }

  async deleteDecision(decision: DecisionArea) {
    if (!decision.id) return;

    try {
      await this.decisionAreaService.deleteDecisionArea(decision.id);
      await this.loadData();
      this.cerrarModalEliminarDecision();
    } catch (error) {
      this.notificationService.createNotification({
        project_id: this.projectId,
        message: 'Error al eliminar la decisión',
        type: 'error'
      });
    }
  }

  async updateDecision(updatedDecision: DecisionArea) {
    if (!updatedDecision.id) return;

    try {
      await this.decisionAreaService.updateDecisionArea(updatedDecision.id, {
        rotulo: updatedDecision.rotulo,
        nombre_area: updatedDecision.nombre_area,
        descripcion: updatedDecision.descripcion
      });
      await this.loadData();
      this.cerrarModal();
      this.cerrarModalEditarDecision();
      this.notificationService.createNotification({
        project_id: this.projectId,
        message: '¡Decisión guardada correctamente!',
        type: 'success'
      });
    } catch (error) {
      this.notificationService.createNotification({
        project_id: this.projectId,
        message: 'Error al guardar la decisión',
        type: 'error'
      });
    }
  }

  async onCheckboxChange(decision: DecisionArea, event: any): Promise<void> {
    if (!decision.id) return;

    const checkbox = event.target as HTMLInputElement;
    const isChecked = checkbox.checked;
    const decisionId = decision.id;

    this.updatingDecisions[decisionId] = true;

    try {
      await this.decisionAreaService.updateDecisionArea(decisionId, {
        is_important: isChecked
      });
      await this.loadData();
    } catch (error) {
      checkbox.checked = !isChecked;
      this.notificationService.createNotification({
        project_id: this.projectId,
        message: 'Error al actualizar el estado de importancia',
        type: 'error'
      });
    } finally {
      delete this.updatingDecisions[decisionId];
    }
  }

  async agregarOpcion() {
    if (!this.nuevaDescripcion.trim() || !this.decisionSeleccionada?.id) {
      this.notificationService.createNotification({
        project_id: this.projectId,
        message: 'Por favor, ingresa una descripción válida.',
        type: 'error'
      });
      return;
    }

    try {
      await this.opcionesService.createOpcion(
        this.projectId,
        this.nuevaDescripcion,
        this.decisionSeleccionada.id
      );
      await this.loadData();
      this.cerrarModal();
    } catch (error) {
      this.notificationService.createNotification({
        project_id: this.projectId,
        message: 'Error al crear la opción',
        type: 'error'
      });
    }
  }

  async deleteOpcion(opcion: Opcion) {
    if (!opcion.id) return;

    try {
      await this.opcionesService.deleteOpcion(opcion.id);
      await this.loadData();
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

  getOpcionesPorArea(areaId: string) {
    return this.opciones.filter(opcion => opcion.cod_area === areaId);
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

  abrirModal(decision: DecisionArea) {
    this.decisionSeleccionada = decision;
    this.modalAbierto = true;
  }

  abrirModalEditarDecision(decision: DecisionArea) {
    this.decisionSeleccionada = decision;
    this.modalEditarDecisionAbierto = true;
  }

  cerrarModal() {
    this.modalAbierto = false;
    this.decisionSeleccionada = null;
    this.nuevaDescripcion = '';
  }

  cerrarModalEditarDecision() {
    this.modalEditarDecisionAbierto = false;
    this.decisionSeleccionada = null;
  }

  abrirModalEliminarDecision(decision: DecisionArea) {
    this.modalEliminarDecisionAbierto = true;
    this.decisionSeleccionada = decision;
  }

  cerrarModalEliminarDecision() {
    this.modalEliminarDecisionAbierto = false;
    this.decisionSeleccionada = null;
  }


  getImportantStatusArea() {
    this.decisionsService.getImportantStatus(this.projectId).subscribe((result) => {
      console.log('Resultado de getImportantStatus:', result);

      // Verificar si hay áreas importantes seleccionadas
      if (result && result.length > 0) {
        // Actualiza areasSeleccionadas con las áreas importantes
        this.areasSeleccionadas = result;

        // Cargar los datos necesarios para la tabla de comparación
        this.loadData().then(() => {
          this.pasoActual = 6; // Avanza al paso 6 solo si hay datos
        });
      } else {
        this.notificationService.createNotification({
          project_id: this.projectId,
          message: 'Debe seleccionar al menos un área como importante',
          type: 'error'
        });
      }
    }, (error) => {
      console.error('Error al obtener el estado importante:', error);
      this.notificationService.createNotification({
        project_id: this.projectId,
        message: 'Error al obtener el estado importante',
        type: 'error'
      });
    });
  }

  recargarpagina() {
    window.location.reload();
  }
}
