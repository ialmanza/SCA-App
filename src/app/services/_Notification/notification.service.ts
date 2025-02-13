import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
  id: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications = new BehaviorSubject<Notification[]>([]);
  private counter = 0;

  getNotifications(): Observable<Notification[]> {
    return this.notifications.asObservable();
  }

  show(message: string, type: 'success' | 'error' | 'info'): void {
    const id = this.counter++;
    const currentNotifications = this.notifications.getValue();
    const newNotification: Notification = { message, type, id };

    this.notifications.next([...currentNotifications, newNotification]);

    // Quita la notificacion a los 5 segundos
    setTimeout(() => {
      this.remove(id);
    }, 5000);
  }

  private remove(id: number): void {
    const currentNotifications = this.notifications.getValue();
    this.notifications.next(
      currentNotifications.filter(notification => notification.id !== id)
    );
  }
}
