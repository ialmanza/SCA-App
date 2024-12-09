import { Component, Input } from '@angular/core';
import { Opcion } from '../../../models/opcion';
import { OpcionesDBService } from '../../../services/_Opciones/opciones-db.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-opcion',
  standalone: true,
  imports: [],
  providers: [OpcionesDBService],
  templateUrl: './opcion.component.html',
  styleUrl: './opcion.component.css'
})
export class OpcionComponent {
  @Input() opciones!: Opcion
  editing: boolean = false;


  constructor( private opcionesDBService: OpcionesDBService) {}

  deleteOpcion(opcion: Opcion) {
    console.log('Eliminando opcion', opcion)
        this.opcionesDBService.deleteItem(opcion.id!).subscribe({
          next: () => {
            console.log(`Opción con id ${opcion.id} eliminada correctamente`);
            this.opcionesDBService.getItems();
          },
          error: (err) => {
            console.error(`Error eliminando la opción con id ${opcion.id}:`, err);
          },
        });
      }



}
