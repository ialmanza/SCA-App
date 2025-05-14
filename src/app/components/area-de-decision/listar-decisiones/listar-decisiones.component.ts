import { Component } from '@angular/core';
import { Decision } from '../../../models/decision';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Opcion } from '../../../models/interfaces';
import { DecisionesDBService } from '../../../services/_Decisiones/decisiones-db.service';
import { OpcionesDBService } from '../../../services/_Opciones/opciones-db.service';

@Component({
  selector: 'app-listar-decisiones',
  standalone: true,
  imports: [ FormsModule, CommonModule],
  providers: [ DecisionesDBService, OpcionesDBService],
  templateUrl: './listar-decisiones.component.html',
  styleUrl: './listar-decisiones.component.css'
})
export class ListarDecisionesComponent {
  decisiones : Decision[];
  opciones: Opcion[];

  constructor(  private decisionesDBService: DecisionesDBService,
               private opcionesDBService: OpcionesDBService) {
    this.decisiones = [];
    this.opciones = [];
  }

  ngOnInit(): void {
    this.decisionesDBService.getItems().subscribe((decisiones : Decision[]) => {
      this.decisiones = decisiones
    })

    this.opcionesDBService.getItems().subscribe((opciones: Opcion[]) => {
      this.opciones = opciones;
    });
  }

}
