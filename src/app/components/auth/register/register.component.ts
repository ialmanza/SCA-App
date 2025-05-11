import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/supabaseServices/auth.service';

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
    private router: Router
  ) {}

  async onSubmit() {
    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
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
        alert('Registration successful! Please check your email to confirm your account.');
        this.router.navigate(['/login']);
      }
    } catch (error: any) {
      this.error = error.message || 'An error occurred during registration';
    } finally {
      this.loading = false;
    }
  }
} 