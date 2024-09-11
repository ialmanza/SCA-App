import { Component, Input } from '@angular/core';
import { Opcion } from '../../../models/opcion';
import { OpcionService } from '../../../services/opcion.service';
import { DialogAnimationsExampleDialog } from '../eliminar-opcion-modal/eliminar-opcion-modal.component';
import { MatDialog } from '@angular/material/dialog';

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

  constructor(private opcionService: OpcionService, private dialog: MatDialog) {}

  // deleteOpcion(ociones : Opcion) {
  //   if(confirm('Está seguro que desea borrar esta opción del área?')) {
  //   this.opcionService.deleteOpcion(ociones.id);
  //   }
  // }

  deleteOpcion(opcion: Opcion) {
    const dialogRef = this.dialog.open(DialogAnimationsExampleDialog, {
      width: '250px',
      data: opcion
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.opcionService.deleteOpcion(opcion.id);
      }
    });
  }



}
