import { Component } from '@angular/core';
import { Decision } from '../../../models/decision';
import { DecisionComponent } from "../decision/decision.component";
import { DecisionService } from '../../../services/decision.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { OpcionService } from '../../../services/opcion.service';
import { Opcion } from '../../../models/opcion';
import { DecisionesDBService } from '../../../services/_Decisiones/decisiones-db.service';
import { OpcionesDBService } from '../../../services/_Opciones/opciones-db.service';

@Component({
  selector: 'app-listar-decisiones',
  standalone: true,
  imports: [DecisionComponent, FormsModule, CommonModule],
  providers: [DecisionService, OpcionService, DecisionesDBService, OpcionesDBService],
  templateUrl: './listar-decisiones.component.html',
  styleUrl: './listar-decisiones.component.css'
})
export class ListarDecisionesComponent {
  decisiones : Decision[];
  opciones: Opcion[];

  // PAGINACIÓN
  pageSizeOptions = [5, 10, 20];
  pageSize = this.pageSizeOptions[0];
  currentPage = 0;
  totalItems = 0;


  constructor( private decisionService: DecisionService, private opcionService: OpcionService, private decisionesDBService: DecisionesDBService,
               private opcionesDBService: OpcionesDBService) {
    this.decisiones = [];
    this.opciones = [];
  }

  ngOnInit(): void {
    // this.decisionService.getDecisiones().subscribe((decisiones : Decision[]) => {
    //   this.decisiones = decisiones
    // });
    this.decisionesDBService.getItems().subscribe((decisiones : Decision[]) => {
      this.decisiones = decisiones
    })

    // this.opcionService.getOpciones().subscribe((opciones: Opcion[]) => {
    //   this.opciones = opciones;
    // });

    this.opcionesDBService.getItems().subscribe((opciones: Opcion[]) => {
      this.opciones = opciones;
    });
  }


  deleteDecision(decisiones : Decision) {
    if(confirm('Está seguro que desea borrar esta área de decisión?')) {
      this.decisionService.deleteDecision(decisiones._id);
    }
  }


// PAGINACIÓN
  updateDisplayedPerros() {
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    //this.displayedPerros = this.filteredPerros.slice(start, end);
  }


  totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  changePageSize(size: number) {
    this.pageSize = size;
    this.currentPage = 0;
    this.updateDisplayedPerros();
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.updateDisplayedPerros();
  }

  nextPage() {
    if (this.currentPage < this.totalPages() - 1) {
      this.currentPage++;
      this.updateDisplayedPerros();
    }
  }

  previousPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updateDisplayedPerros();
    }
  }


}
