import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

// Importaciones de componentes personalizados
import { AppInputComponent} from '../../../core/components/app-input/app-input.component';
import { AppButtonComponent } from '../../../core/components/app-button/app-button.component';
import { SmartLogoComponent} from '../../../core/components/smart-logo/smart-logo.component';
import { AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    RouterModule,
    AppInputComponent,
    AppButtonComponent,
    SmartLogoComponent
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  errorType = '';
  showSuccessMessage = false;
  token = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.getTokenFromUrl();
  }

  private initializeForm(): void {
    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private getTokenFromUrl(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (!this.token) {
        this.showError('Token de restablecimiento no válido', 'invalid_token');
      }
    });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    if (confirmPassword?.errors?.['passwordMismatch']) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }

    return null;
  }

  onSubmit(): void {
    if (this.resetPasswordForm.valid && !this.isLoading && this.token) {
      this.resetPassword();
    } else {
      this.markFormGroupTouched();
    }
  }

  private resetPassword(): void {
    this.isLoading = true;
    this.clearMessages();

    const newPassword = this.resetPasswordForm.get('password')?.value;

    this.authService.resetPassword(this.token, newPassword).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.showSuccessMessage = true;
        setTimeout(() => {
          this.router.navigate(['/login'], {
            queryParams: {
              message: 'password_reset_success'
            }
          });
        }, 2500);
      },
      error: (error) => {
        this.isLoading = false;
        this.handleResetPasswordError(error);
      }
    });
  }

  private handleResetPasswordError(error: any): void {
    console.error('Error en reset password:', error);

    if (error.status === 400) {
      this.showError('Token inválido o expirado. Solicita un nuevo enlace', 'invalid_token');
    } else if (error.status === 0) {
      this.showError('Error de conexión. Verifica tu internet e intenta de nuevo', 'network');
    } else {
      this.showError('Error inesperado. Intenta de nuevo más tarde', 'server_error');
    }
  }

  retrySubmit(): void {
    this.resetPassword();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private showError(message: string, type: string): void {
    this.errorMessage = message;
    this.errorType = type;
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.errorType = '';
    this.showSuccessMessage = false;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.resetPasswordForm.controls).forEach(key => {
      const control = this.resetPasswordForm.get(key);
      control?.markAsTouched();
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  requestNewToken(): void {
    this.router.navigate(['/forgot-password']);
  }
}
