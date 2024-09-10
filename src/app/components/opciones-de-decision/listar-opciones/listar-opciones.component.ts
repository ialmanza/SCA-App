import { Component } from '@angular/core';
import { OpcionComponent } from "../opcion/opcion.component";
import { Opcion } from '../../../models/opcion';
import { OpcionService } from '../../../services/opcion.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-listar-opciones',
  standalone: true,
  imports: [OpcionComponent, CommonModule],
  templateUrl: './listar-opciones.component.html',
  styleUrl: './listar-opciones.component.css'
})
export class ListarOpcionesComponent {
  opciones : Opcion[];

  constructor( private opcionService: OpcionService) {
    this.opciones = [];
  }

  ngOnInit(): void {
    this.opcionService.getOpciones().subscribe((opciones : Opcion[]) => {
      this.opciones = opciones
    });
  }

}
