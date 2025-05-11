import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/supabaseServices/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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
    private router: Router
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
      this.error = error.message || 'An error occurred during login';
    } finally {
      this.loading = false;
    }
  }

  async resetPassword() {
    if (!this.email) {
      this.error = 'Please enter your email address';
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      const { error } = await this.authService.resetPassword(this.email);

      if (error) {
        throw error;
      }

      alert('Password reset instructions have been sent to your email');
    } catch (error: any) {
      this.error = error.message || 'An error occurred while sending reset instructions';
    } finally {
      this.loading = false;
    }
  }
}
