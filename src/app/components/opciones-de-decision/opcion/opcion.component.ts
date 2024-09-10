import { Component, Input } from '@angular/core';
import { Opcion } from '../../../models/opcion';
import { OpcionService } from '../../../services/opcion.service';

@Component({
  selector: 'app-opcion',
  standalone: true,
  imports: [],
  templateUrl: './opcion.component.html',
  styleUrl: './opcion.component.css'
})
export class OpcionComponent {
  @Input() opciones!: Opcion
  editing: boolean = false;

  constructor(private opcionService: OpcionService) {}

  deleteOpcion(ociones : Opcion) {
    if(confirm('Está seguro que desea borrar esta opción del área?')) {
    this.opcionService.deleteOpcion(ociones.id);
    }
  }




}
