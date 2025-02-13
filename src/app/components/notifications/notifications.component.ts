import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/_Notification/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [ CommonModule ],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css'
})
export class NotificationsComponent {
  notifications$ = this.notificationService.getNotifications();

  constructor(private notificationService: NotificationService) {}
}
