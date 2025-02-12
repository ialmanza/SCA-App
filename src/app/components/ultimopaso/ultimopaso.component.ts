import { Component, OnInit } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { DropdbService } from '../../services/_DeleteDB/dropdb.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ultimopaso',
  standalone: true,
  imports: [ CommonModule ],
  templateUrl: './ultimopaso.component.html',
  styleUrls: ['./ultimopaso.component.scss'],
  animations: [
    trigger('warningAnimation', [
      state('void', style({
        transform: 'translateY(-20px)',
        opacity: 0
      })),
      state('*', style({
        transform: 'translateY(0)',
        opacity: 1
      })),
      transition('void => *', animate('300ms ease-out')),
      transition('* => void', animate('300ms ease-in'))
    ])
  ]
})
export class UltimopasoComponent implements OnInit  {
  showWarning = false;
  isHovering = false;

  constructor(private dropservice: DropdbService) {}

  ngOnInit(): void {}

  onButtonHover(): void {
    this.showWarning = true;
    this.isHovering = true;
  }

  onButtonLeave(): void {
    this.isHovering = false;
    setTimeout(() => {
      if (!this.isHovering) {
        this.showWarning = false;
      }
    }, 2000);
  }

  eliminarProceso(): void {
    if (confirm('¿Está seguro que desea eliminar el proceso? Esta acción no se puede deshacer y deberá comenzar desde cero.')) {
      this.dropservice.dropDB().subscribe({
        next: (response) => {
          console.log('Proceso eliminado exitosamente');
          // Aquí puedes agregar la lógica para redireccionar o mostrar un mensaje de éxito
        },
        error: (error) => {
          console.error('Error al eliminar el proceso:', error);
          // Aquí puedes agregar la lógica para manejar el error
        }
      });
    }
  }
}
