import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

// Importaciones de componentes personalizados
import { AppInputComponent} from '../../../core/components/app-input/app-input.component';
import { AppButtonComponent } from '../../../core/components/app-button/app-button.component';
import { SmartLogoComponent} from '../../../core/components/smart-logo/smart-logo.component';

@Component({
  selector: 'app-forgot-password',
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
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  errorType = '';
  showSuccessMessage = false;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.valid && !this.isLoading) {
      this.resetPassword();
    } else {
      this.markFormGroupTouched();
    }
  }

  private resetPassword(): void {
    this.isLoading = true;
    this.clearMessages();

    const email = this.forgotPasswordForm.get('email')?.value;

    // Simulación de llamada a API
    setTimeout(() => {
      this.handleResetPasswordResponse(email);
    }, 2000);
  }

  private handleResetPasswordResponse(email: string): void {
    this.isLoading = false;

    // Simulación de diferentes respuestas
    if (email === 'notfound@test.com') {
      this.showError('No encontramos una cuenta con este email', 'email_not_found');
    } else if (email === 'ratelimit@test.com') {
      this.showError('Has solicitado muchos enlaces. Intenta de nuevo en 15 minutos', 'rate_limit');
    } else if (email === 'network@test.com') {
      this.showError('Error de conexión. Verifica tu internet e intenta de nuevo', 'network');
    } else {
      // Éxito
      this.showSuccessMessage = true;
      setTimeout(() => {
        this.router.navigate(['/login'], {
          queryParams: {
            message: 'check_email',
            email: email
          }
        });
      }, 2500);
    }
  }

  retrySubmit(): void {
    this.resetPassword();
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
    Object.keys(this.forgotPasswordForm.controls).forEach(key => {
      const control = this.forgotPasswordForm.get(key);
      control?.markAsTouched();
    });
  }
}
