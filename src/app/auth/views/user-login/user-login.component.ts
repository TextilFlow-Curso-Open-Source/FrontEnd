import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { AppInputComponent } from '../../../core/components/app-input/app-input.component';
import { AppButtonComponent } from '../../../core/components/app-button/app-button.component';
import { SmartLogoComponent } from '../../../core/components/smart-logo/smart-logo.component';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';

type ErrorType = 'credentials' | 'blocked' | 'network' | 'timeout' | 'generic';

@Component({
  selector: 'app-user-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    AppInputComponent,
    AppButtonComponent,
    SmartLogoComponent,
    MatIconModule
  ],
  templateUrl: './user-login.component.html',
  styleUrls: ['./user-login.component.css']
})
export class UserLoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  errorType: ErrorType = 'generic';
  showPassword = false;
  showSuccessMessage = false;

  // Para manejar deep linking
  private returnUrl: string = '';
  private destroy$ = new Subject<void>();
  private loginTimeout: any;
  private lastLoginAttempt: any = null;

  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    // Capturar URL de retorno para deep linking
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '';

    // Verificar si el usuario ya está autenticado
    if (this.authService.isAuthenticated()) {
      this.handleAuthenticatedUser();
      return;
    }

    // Aplicar tema automático del sistema en el login
    this.applySystemTheme();

    // Cargar credenciales recordadas si existen
    this.loadRememberedCredentials();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.loginTimeout) {
      clearTimeout(this.loginTimeout);
    }
  }

  /**
   * Maneja usuarios ya autenticados
   */
  private handleAuthenticatedUser(): void {
    const role = this.authService.getCurrentUserRole();

    if (this.returnUrl) {
      this.router.navigateByUrl(this.returnUrl);
    } else if (role === 'businessman' || role === 'supplier') {
      this.authService.redirectBasedOnRole(role);
    } else if (role === 'pending') {
      this.authService.redirectBasedOnRole('pending');
    }
  }

  /**
   * Carga credenciales recordadas del localStorage
   */
  private loadRememberedCredentials(): void {
    try {
      const remembered = localStorage.getItem('textilflow_remembered_credentials');
      if (remembered) {
        const credentials = JSON.parse(remembered);
        this.loginForm.patchValue({
          email: credentials.email,
          rememberMe: true
        });
      }
    } catch (error) {
      // Error silencioso, no afecta funcionalidad principal
    }
  }

  /**
   * Aplica el tema automático del sistema al cargar el login
   */
  private applySystemTheme(): void {
    this.themeService.setTheme('auto');

    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        // El tema automático se actualizará solo
      });
  }

  /**
   * Alterna la visibilidad de la contraseña
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Maneja el envío del formulario
   */
  onSubmit(): void {
    if (this.loginForm.invalid || this.isLoading) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.startLogin();
  }

  /**
   * Inicia el proceso de login
   */
  private startLogin(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.showSuccessMessage = false;
    this.lastLoginAttempt = { ...this.loginForm.value };

    // Timeout de seguridad
    this.loginTimeout = setTimeout(() => {
      if (this.isLoading) {
        this.handleLoginError('timeout', 'Tiempo de espera agotado. Intenta nuevamente.');
      }
    }, 30000); // 30 segundos

    // Manejar credenciales recordadas
    this.handleRememberMe();

    // Interceptar el comportamiento del AuthService para manejar errores
    this.interceptAuthServiceLogin();
  }

  /**
   * Intercepta el login del AuthService para manejar éxito y errores
   */
  private interceptAuthServiceLogin(): void {
    const credentials = this.loginForm.value;

    // Usar directamente el AuthService
    this.authService.login(credentials);

    // Timeout de seguridad
    setTimeout(() => {
      if (this.isLoading) {
        this.isLoading = false;
        this.errorMessage = 'Credenciales incorrectas. Intenta nuevamente.';
      }
    }, 5000);
  }

  /**
   * Maneja el éxito del login
   */
  private handleLoginSuccess(): void {
    if (this.loginTimeout) {
      clearTimeout(this.loginTimeout);
    }

    this.isLoading = false;

    // Mostrar toast de éxito
    this.showSuccessMessage = true;
  }

  /**
   * Maneja errores de login
   */
  private handleLoginError(type: ErrorType, message: string): void {
    if (this.loginTimeout) {
      clearTimeout(this.loginTimeout);
    }

    this.isLoading = false;
    this.showSuccessMessage = false;
    this.errorType = type;
    this.errorMessage = message;

    // Limpiar credenciales recordadas si hay error de credenciales
    if (type === 'credentials') {
      localStorage.removeItem('textilflow_remembered_credentials');
      this.loginForm.get('rememberMe')?.setValue(false);
    }
  }

  /**
   * Reintenta el login con las últimas credenciales
   */
  retryLogin(): void {
    if (this.lastLoginAttempt) {
      this.loginForm.patchValue(this.lastLoginAttempt);
      this.startLogin();
    }
  }

  /**
   * Maneja la opción "Recordarme"
   */
  private handleRememberMe(): void {
    const rememberMe = this.loginForm.get('rememberMe')?.value;
    const email = this.loginForm.get('email')?.value;

    if (rememberMe && email) {
      try {
        localStorage.setItem('textilflow_remembered_credentials', JSON.stringify({ email }));
      } catch (error) {
        // Error silencioso
      }
    } else {
      localStorage.removeItem('textilflow_remembered_credentials');
    }
  }
}
