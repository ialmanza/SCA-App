import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CrearDecisionComponent } from "../crear-decision/crear-decision.component";
import { ListarDecisionesComponent } from "../listar-decisiones/listar-decisiones.component";
import { Decision } from '../../../models/decision';
import { DecisionService } from '../../../services/decision.service';
import { OpcionService } from '../../../services/opcion.service';
import { Opcion } from '../../../models/opcion';
import { MatDialog } from '@angular/material/dialog';
import * as d3 from 'd3';
import { GrafoComponent } from "../../grafo/grafo.component";
import { PosiblesAlternativasComponent } from "../../posibles-alternativas/posibles-alternativas.component";
import { ModoDeComparacionComponent } from "../../modo-de-comparacion/modo-de-comparacion.component";
import { TablaDeComparacionComponent } from "../../tabla-de-comparacion/tabla-de-comparacion.component";
import { DecisionesDBService } from '../../../services/_Decisiones/decisiones-db.service';
import { catchError, EMPTY, switchMap } from 'rxjs';
import { OpcionesDBService } from '../../../services/_Opciones/opciones-db.service';
import { DialogAnimationsExampleDialog } from '../eliminar-decision-modal/eliminar-decision.component';
import { TablaDecisionesComponent } from "../tabla-decisiones/tabla-decisiones.component";
import { DecisionCheckComponent } from "../decision-check/decision-check.component";
import { VinculodbService } from '../../../services/_Vinculos/vinculodb.service';
import { VinculosComponent } from "../../vinculos/vinculos.component";
import { PuntuacionesMinimasComponent } from "../../puntuaciones-minimas/puntuaciones-minimas.component";
import { TablaDeSeleccionComponent } from "../../tabla-de-seleccion/tabla-de-seleccion.component";



@Component({
  selector: 'app-decisiones-form',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule, CrearDecisionComponent, ListarDecisionesComponent,
    GrafoComponent, PosiblesAlternativasComponent, ModoDeComparacionComponent, TablaDeComparacionComponent, TablaDecisionesComponent, DecisionCheckComponent, VinculosComponent, PuntuacionesMinimasComponent, TablaDeSeleccionComponent],
  providers: [DecisionService, OpcionService, DecisionesDBService, OpcionesDBService, VinculodbService],
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



  constructor(private decisionService: DecisionService, private opcionService: OpcionService, public dialog: MatDialog, private decisionesDBService: DecisionesDBService
    , private opcionesDBService: OpcionesDBService, private vinculodbService: VinculodbService) {
    this.decisiones = [];
    this.opciones = [];
  }

  ngOnInit(): void {
    // this.decisionService.getDecisiones().subscribe((decisiones : Decision[]) => {
    //   this.areas = decisiones
    //   this.decisiones = decisiones.map(decision => ({ ...decision, seleccionado: false }));
    // });

    this.decisionesDBService.getItems().subscribe((decisiones: Decision[]) => {
      this.areas = decisiones
      this.decisiones = decisiones.map(decision => ({ ...decision, seleccionado: false }));
    });

    // this.opcionService.getOpciones().subscribe((opciones: Opcion[]) => {
    //   this.opciones = opciones;
    // });
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

  // crearVinculo(): void {
  //   if (this.selectedArea1 && this.selectedArea2 && this.selectedArea1 !== this.selectedArea2) {
  //     // const nuevoVinculo = `${this.selectedArea1.area} - ${this.selectedArea2.area}`;
  //     const area_id = this.selectedArea1.id!;
  //     const related_area_id = this.selectedArea2.id!;
  //     //this.decisionService.crearVinculo(nuevoVinculo);
  //     this.vinculodbService.createItem(area_id, related_area_id).subscribe(() => {
  //       this.selectedArea1 = null;
  //       this.selectedArea2 = null;
  //     });


  //   } else {
  //     console.error('Áreas no válidas para crear un vínculo.');
  //   }
  // }

  addDecision(area: HTMLInputElement, descripcion: HTMLTextAreaElement) {
    const rotuloPattern = /^[A-Z]{3}_[A-Z]{3}$/;

    if (!rotuloPattern.test(this.rotuloValue)) {
      alert('El rotulo debe estar en el formato "ABC_DEF".');
      area.value = '';
      this.rotuloValue = '';
      descripcion.value = '';
      return;
    }

    if (!area.value || !descripcion.value) {
      alert('Por favor rellene todos los campos.');
      area.value = '';
      this.rotuloValue = '';
      descripcion.value = '';
      return;
    }

    const id = Date.now().toString();
    this.decisionService.addDecision({
      _id: id,
      area: area.value,
      rotulo: this.rotuloValue,
      description: descripcion.value

    })
    area.value = '';
    this.rotuloValue = '';
    descripcion.value = '';
    return false;
  }

  deleteDecision(decisiones: Decision) {

    this.decisionesDBService.deleteItem(decisiones.id!)
      .pipe(
        catchError(error => {
          console.error('Error al eliminar la decisión:', error);
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
          console.error('Error al obtener las decisiones actualizadas:', error);
        }
      });
  }

  updateDecision(updatedDecision: Decision) {
    this.decisionesDBService.updateItem(updatedDecision.id!, updatedDecision)
      .pipe(
        switchMap(() => this.decisionesDBService.getItems()),
        catchError(error => {
          console.error('Error al actualizar u obtener las decisiones:', error);
          return EMPTY;
        })
      )
      .subscribe({
        next: (decisiones: Decision[]) => {
          this.decisiones = decisiones.map(decision => ({ ...decision, seleccionado: false }));
          this.cerrarModal();
          this.cerrarModalEditarDecision();
          alert('¡Decisión guardada correctamente!');

        },
        error: (error: any) => {
          console.error('Error en la suscripción:', error);
        }
      });
  }


  avanzarPaso() {
    if (this.pasoActual < 20) {
      this.pasoActual++;
      // if (this.pasoActual === 7 || this.pasoActual === 10) {
      //   console.log(this.areasSeleccionadas);
      //   this.areasSeleccionadas = [];
      // }
    }
  }

  retrocederPaso() {
    if (this.pasoActual > 1) {
      this.pasoActual--;
      // if (this.pasoActual === 7 ) {
      //   this.areasSeleccionadas = [];
      // }
    }
  }

  getOpcionesPorArea(areaId: number) {
    return this.opciones.filter(opcion => opcion.cod_area.toString() === areaId.toString());  // Filtrar opciones por área de decisión

  }

  onCheckboxChange(decision: Decision, event: any): void {
    const checkbox = event.target as HTMLInputElement;
    const isChecked = checkbox.checked;
    const decisionId = decision.id!;

    this.updatingDecisions[decisionId] = true;

    this.decisionesDBService.updateImportantStatus(decisionId, isChecked)
      .pipe(
        catchError(error => {
          console.error('Error al actualizar el estado de importancia:', error);
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
          console.error('Error al obtener las decisiones actualizadas:', error);
          delete this.updatingDecisions[decisionId];
        }
      });
  }

  //CRUD PARA LAS OPCIONES DENTRO DE LAS DECISIONES

  agregarOpcion() {
    if (!this.nuevaDescripcion.trim()) {
      alert('Por favor, ingresa una descripción válida.');
      return;
    }

    const nuevaOpcion: Opcion = {
      _id: Date.now().toString(),
      descripcion: this.nuevaDescripcion,
      cod_area: this.decisionSeleccionada?.id?.toString() ?? ''
    };


    //this.opcionService.addOpcion(nuevaOpcion);
    this.opcionesDBService.createItem(nuevaOpcion).subscribe(() => {
      console.log(nuevaOpcion.cod_area);
      console.log(typeof nuevaOpcion.cod_area);
      this.opcionesDBService.getItems().subscribe((opcionesActualizadas) => {
        this.opciones = opcionesActualizadas;
      });
    });

    // this.opcionService.getOpciones().subscribe((opcionesActualizadas) => {
    //   this.opciones = opcionesActualizadas;
    // });



    this.cerrarModal();
  }

  eliminarOpcion(id: string) {
    // this.opcionService.deleteOpcion(id);
    // this.opcionService.getOpciones().subscribe((opcionesActualizadas) => {
    //   this.opciones = opcionesActualizadas;
    // });

  }

  deleteOpcion(opcion: Opcion) {
    this.opcionesDBService.deleteItem(opcion.id!).subscribe({
      next: () => {
        console.log(`Opción con id ${opcion.id} eliminada correctamente`);
        alert(`La opción fue eliminada correctamente.`);

        // Recargar la página
        this.loadOpciones();  // Asegúrate de tener un método que recargue las opciones
      },
      error: (err) => {
        console.error(`Error eliminando la opción con id ${opcion.id}:`, err);
      },
    });
  }

  loadOpciones() {
    this.opcionesDBService.getItems().subscribe({
      next: (opciones) => {
        this.opciones = opciones;  // Asumiendo que 'opciones' es una propiedad en tu componente
      },
      error: (err) => {
        console.error('Error al cargar las opciones:', err);
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

  avanzarYrecargarpagina() { //No Usar
    this.avanzarPaso();
    window.location.reload(); //REACARGA LA PAGINA
  }
}
