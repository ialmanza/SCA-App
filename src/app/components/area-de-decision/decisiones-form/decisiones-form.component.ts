import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule} from '@angular/forms';
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


interface CustomNode extends d3.SimulationNodeDatum {
  id: string;
}
@Component({
  selector: 'app-decisiones-form',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule, CrearDecisionComponent, ListarDecisionesComponent,
           GrafoComponent, PosiblesAlternativasComponent, ModoDeComparacionComponent, TablaDeComparacionComponent],
  providers: [DecisionService, OpcionService, DecisionesDBService],
  templateUrl: './decisiones-form.component.html',
  styleUrl: './decisiones-form.component.css'
})
export class DecisionesFormComponent {

  pasoActual: number = 1;
  decisiones : Decision[];
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



  constructor( private decisionService: DecisionService, private opcionService: OpcionService, public dialog: MatDialog, private decisionesDBService: DecisionesDBService) {
    this.decisiones = [];
    this.opciones = [];
  }

  ngOnInit(): void {
    // this.decisionService.getDecisiones().subscribe((decisiones : Decision[]) => {
    //   this.areas = decisiones
    //   this.decisiones = decisiones.map(decision => ({ ...decision, seleccionado: false }));
    // });

    this.decisionesDBService.getItems().subscribe((decisiones : Decision[]) => {
      this.areas = decisiones
      this.decisiones = decisiones.map(decision => ({ ...decision, seleccionado: false }));
    });

    this.opcionService.getOpciones().subscribe((opciones: Opcion[]) => {
      this.opciones = opciones;
    });

    this.eliminarVinculos();

    this.decisionService.obtenerVinculos().subscribe((vinculos: string[]) => {
      this.vinculos = vinculos;
    });

  }

  eliminarVinculos(): void {
    this.vinculos = [];
  }

  crearVinculo(): void {
    if (this.selectedArea1 && this.selectedArea2 && this.selectedArea1 !== this.selectedArea2) {
      const nuevoVinculo = `${this.selectedArea1.area} - ${this.selectedArea2.area}`;
      this.decisionService.crearVinculo(nuevoVinculo);

      this.selectedArea1 = null;
      this.selectedArea2 = null;
    } else {
      console.error('Áreas no válidas para crear un vínculo.');
    }
  }

  addDecision( area:HTMLInputElement, descripcion:HTMLTextAreaElement) {
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
        id: id,
        area: area.value,
        rotulo: this.rotuloValue,
        description: descripcion.value

      })
      area.value = '';
      this.rotuloValue = '';
      descripcion.value = '';
      return false;
  }

  deleteDecision(decisiones : Decision) {
      this.decisionService.deleteDecision(decisiones.id);
      this.decisionService.getDecisiones().subscribe((decisiones : Decision[]) => {
        this.decisiones = decisiones.map(decision => ({ ...decision, seleccionado: false }));
      })
      this.cerrarModalEliminarDecision();

  }

  updateDecision(updatedDecision: Decision) {
    this.decisionService.updateDecision(updatedDecision);
    this.decisionService.getDecisiones().subscribe((decisiones : Decision[]) => {
      this.decisiones = decisiones.map(decision => ({ ...decision, seleccionado: false }));
    })

    this.cerrarModal();
    this.cerrarModalEditarDecision();

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

  getOpcionesPorArea(areaId: string) {
    return this.opciones.filter(opcion => opcion.cod_area === areaId);  // Filtrar opciones por área de decisión
  }

  onCheckboxChange(decision: Decision, event: any): void {
    if (event.target.checked) {
        this.areasSeleccionadas.push(decision);
        this.decisionService.agregarDecision(decision); // Notifica al servicio para agregar una decisión
    } else {
        this.areasSeleccionadas = this.areasSeleccionadas.filter(d => d.id !== decision.id);
        this.decisionService.eliminarDecision(decision.id); // Notifica al servicio para eliminar una decisión
    }
}

  //CRUD PARA LAS OPCIONES DENTRO DE LAS DECISIONES

  agregarOpcion() {
    if (!this.nuevaDescripcion.trim()) {
      alert('Por favor, ingresa una descripción válida.');
      return;
    }

    const nuevaOpcion: Opcion = {
      id: Date.now().toString(),
      descripcion: this.nuevaDescripcion,
      cod_area: this.decisionSeleccionada!.id
    };


    this.opcionService.addOpcion(nuevaOpcion);


    this.opcionService.getOpciones().subscribe((opcionesActualizadas) => {
      this.opciones = opcionesActualizadas;
    });


    this.cerrarModal();
  }

  eliminarOpcion(id: string) {
    this.opcionService.deleteOpcion(id);
    this.opcionService.getOpciones().subscribe((opcionesActualizadas) => {
      this.opciones = opcionesActualizadas;
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

}
