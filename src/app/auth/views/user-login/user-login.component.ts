// /src/app/auth/views/user-login/user-login.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { AppInputComponent } from '../../../core/components/app-input/app-input.component';
import { AppButtonComponent } from '../../../core/components/app-button/app-button.component';
import { SmartLogoComponent } from '../../../core/components/smart-logo/smart-logo.component';

@Component({
  selector: 'app-user-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    AppInputComponent,
    AppButtonComponent,
    SmartLogoComponent
  ],
  templateUrl: './user-login.component.html',
  styleUrls: ['./user-login.component.css']
})
export class UserLoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private fb = inject(FormBuilder);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Verificar si el usuario ya está autenticado
    if (this.authService.isAuthenticated()) {
      const role = this.authService.getCurrentUserRole();
      if (role === 'businessman' || role === 'supplier') {
        this.authService.redirectBasedOnRole(role);
      } else if (role === 'pending') {
        this.authService.redirectBasedOnRole('pending');
      }
    }

    // Aplicar tema automático del sistema en el login
    this.applySystemTheme();
  }

  /**
   * Aplica el tema automático del sistema al cargar el login
   */
  private applySystemTheme(): void {
    // Detectar tema del sistema
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    console.log(`🎨 Sistema prefiere tema: ${prefersDark ? 'dark' : 'light'}`);

    // Aplicar tema automático (que detectará el sistema)
    this.themeService.setTheme('auto');

    // Escuchar cambios en el tema del sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      console.log(`🔄 Tema del sistema cambió a: ${e.matches ? 'dark' : 'light'}`);
      // El tema automático se actualizará solo
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.isLoading) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    console.log(' Iniciando sesión...');

    // AuthService ahora carga automáticamente las configuraciones del usuario
    this.authService.login(this.loginForm.value);

    // El loading se mantendrá hasta que el usuario sea redirigido
  }
}
