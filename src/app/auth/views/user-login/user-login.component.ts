// /src/app/auth/views/user-login/user-login.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AppInputComponent } from '../../../core/components/app-input/app-input.component';
import { AppButtonComponent } from '../../../core/components/app-button/app-button.component';

@Component({
  selector: 'app-user-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AppInputComponent, AppButtonComponent],
  templateUrl: './user-login.component.html',
  styleUrls: ['./user-login.component.css']
})
export class UserLoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Verificar si el usuario ya está autenticado
    if (this.authService.isAuthenticated()) {
      const role = this.authService.getCurrentUserRole();
      if (role === 'businessman' || role === 'supplier') {
        this.authService.redirectBasedOnRole(role);
      } else if (role === 'pending') {
        this.authService.redirectBasedOnRole('pending');
      }
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      this.authService.login(this.loginForm.value);
      // No es necesario manejar la respuesta porque el servicio lo hace todo
      this.isLoading = false;
    } catch (error) {
      this.isLoading = false;
      this.errorMessage = 'Error al iniciar sesión. Por favor, inténtelo de nuevo.';
      console.error('Login error:', error);
    }
  }
}
