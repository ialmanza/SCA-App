import { Component } from '@angular/core';
import { OpcionComponent } from "../opcion/opcion.component";
import { Opcion } from '../../../models/opcion';
import { OpcionService } from '../../../services/opcion.service';
import { CommonModule } from '@angular/common';
import { OpcionesDBService } from '../../../services/_Opciones/opciones-db.service';

@Component({
  selector: 'app-listar-opciones',
  standalone: true,
  imports: [OpcionComponent, CommonModule],
  providers: [OpcionesDBService],
  templateUrl: './listar-opciones.component.html',
  styleUrl: './listar-opciones.component.css'
})
export class ListarOpcionesComponent {
  opciones : Opcion[];

  constructor( private opcionService: OpcionService, private opcionesDBService: OpcionesDBService) {
    this.opciones = [];
  }

  ngOnInit(): void {
    // this.opcionService.getOpciones().subscribe((opciones : Opcion[]) => {
    //   this.opciones = opciones
    // });
    this.opcionesDBService.getItems().subscribe((opciones : Opcion[]) => {
      this.opciones = opciones
    })
  }

}
