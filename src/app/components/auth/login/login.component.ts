import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/supabaseServices/auth.service';
import { NotificationService } from '../../../services/_Notification/notification.service';
import { NotificationsComponent } from "../../notifications/notifications.component";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NotificationsComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  loading: boolean = false;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  async onSubmit() {
    this.loading = true;
    this.error = null;

    try {
      const { user, error } = await this.authService.signIn(this.email, this.password);

      if (error) {
        throw error;
      }

      if (user) {
        this.router.navigate(['/dashboard']);
      }
    } catch (error: any) {
      this.error = error.message || 'Se produjo un error durante el inicio de sesión';
    } finally {
      this.loading = false;
    }
  }

  async resetPassword() {
    if (!this.email) {
      this.error = 'Por favor, introduzca su dirección de correo electrónico';
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      const { error } = await this.authService.resetPassword(this.email);

      if (error) {
        throw error;
      }

      this.notificationService.show('Se han enviado instrucciones para restablecer la contraseña a su correo electrónico.', 'info');
      this.router.navigate(['/login']);
    } catch (error: any) {
      this.error = error.message || 'Se produjo un error al enviar las instrucciones de reinicio';
    } finally {
      this.loading = false;
    }
  }
}
