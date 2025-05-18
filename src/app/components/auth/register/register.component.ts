import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/supabaseServices/auth.service';
import { NotificationService } from '../../../services/_Notification/notification.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  loading: boolean = false;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  async onSubmit() {
    if (this.password !== this.confirmPassword) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      const { user, error } = await this.authService.signUp(this.email, this.password);

      if (error) {
        throw error;
      }

      if (user) {
        this.notificationService.show('Registro exitoso! Por favor revise su correo para activar su cuenta.', 'success');
        this.router.navigate(['/login']);
      }
    } catch (error: any) {
      this.error = error.message || 'Ocurrió un error durante el registro';
    } finally {
      this.loading = false;
    }
  }
}
