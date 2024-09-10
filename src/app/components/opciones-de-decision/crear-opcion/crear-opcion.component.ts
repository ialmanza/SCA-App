import { Component } from '@angular/core';
import { OpcionService } from '../../../services/opcion.service';
import { identifierName } from '@angular/compiler';

@Component({
  selector: 'app-crear-opcion',
  standalone: true,
  imports: [],
  providers: [ OpcionService ],
  templateUrl: './crear-opcion.component.html',
  styleUrl: './crear-opcion.component.css'
})
export class CrearOpcionComponent {

    constructor( private opcionService: OpcionService) {}

    addOpcion(opcion : HTMLInputElement) {
      const id = Date.now().toString();
      this.opcionService.addOpcion({
        id: id,
        descripcion: opcion.value,
        cod_area: 'de prueba'
      });

      opcion.value = '';
      return false;
    }

}
