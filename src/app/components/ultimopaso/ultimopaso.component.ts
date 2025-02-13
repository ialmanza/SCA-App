import { Component, OnInit } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { DropdbService } from '../../services/_DeleteDB/dropdb.service';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/_Notification/notification.service';
import { NotificationsComponent } from "../notifications/notifications.component";

@Component({
  selector: 'app-ultimopaso',
  standalone: true,
  imports: [CommonModule, NotificationsComponent],
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
  isMobile = window.innerWidth <= 768;


  constructor(private dropservice: DropdbService, private notificationservice: NotificationService) {
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 768;
      if (this.isMobile) {
        this.showWarning = true;
      }
    });
  }

  ngOnInit(): void {
    if (this.isMobile) {
      this.showWarning = true;
    }
  }

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
          this.notificationservice.show('Proceso eliminado exitosamente', 'success');
        },
        error: (error) => {
          this.notificationservice.show('Error al eliminar el proceso', 'error');
        }
      });
    }
  }
}
