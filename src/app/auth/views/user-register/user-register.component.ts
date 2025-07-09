// /src/app/auth/views/user-register/user-register.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AppInputComponent } from '../../../core/components/app-input/app-input.component';
import { AppButtonComponent } from '../../../core/components/app-button/app-button.component';
import { HttpClient } from '@angular/common/http';
import { SmartLogoComponent } from '../../../core/components/smart-logo/smart-logo.component';

@Component({
  selector: 'app-user-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AppInputComponent, AppButtonComponent, SmartLogoComponent],
  templateUrl: './user-register.component.html',
  styleUrls: ['./user-register.component.css']
})
export class UserRegisterComponent implements OnInit {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  // Opciones para selects
  countries: Array<{label: string, value: string}> = [];
  cities: Array<{label: string, value: string}> = [];
  loadingCities = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private http: HttpClient
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      country: ['', [Validators.required]],
      city: ['', [Validators.required]],
      address: ['', [Validators.required]],
      phone: ['', [Validators.required]]
    });

    // Cargar ciudades cuando cambia el país
    this.registerForm.get('country')?.valueChanges.subscribe(country => {
      if (country) {
        this.loadCitiesByCountry(country);
      } else {
        this.cities = [];
      }
      this.registerForm.get('city')?.setValue('');
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

  ngOnInit(): void {
    this.loadCountries();
  }

  loadCountries(): void {
    this.http.get<any>('https://countriesnow.space/api/v0.1/countries')
      .subscribe({
        next: (response) => {
          if (response.data && Array.isArray(response.data)) {
            this.countries = response.data.map((country: any) => ({
              label: country.country,
              value: country.country
            }));
          }
        },
        error: (error) => {
          console.error('Error al cargar países:', error);
        }
      });
  }

  loadCitiesByCountry(country: string): void {
    this.loadingCities = true;
    this.http.post<any>('https://countriesnow.space/api/v0.1/countries/cities', { country })
      .subscribe({
        next: (response) => {
          this.loadingCities = false;
          if (response.data && Array.isArray(response.data)) {
            this.cities = response.data.map((city: string) => ({
              label: city,
              value: city
            }));
          }
        },
        error: (error) => {
          this.loadingCities = false;
          console.error('Error al cargar ciudades:', error);
        }
      });
  }

  onSubmit(): void {
    if (this.registerForm.invalid || this.isLoading) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // ✅ ACTUALIZADO: Usar el método registerUser que retorna Observable
    this.authService.registerUser(this.registerForm.value).subscribe({
      next: (success) => {
        this.isLoading = false;
        if (success) {
          // El registro fue exitoso, AuthService se encarga de la redirección
          console.log('✅ Registro exitoso');
        }
      },
      error: (error) => {
        this.isLoading = false;

        // ✅ NUEVO: Manejar diferentes tipos de errores
        if (error.status === 400) {
          if (error.error && typeof error.error === 'string') {
            // Error específico del backend
            if (error.error.includes('email') || error.error.toLowerCase().includes('already exists')) {
              this.errorMessage = 'Este email ya está registrado. Intenta con otro.';
            } else if (error.error.includes('password')) {
              this.errorMessage = 'La contraseña no cumple con los requisitos de seguridad.';
            } else {
              this.errorMessage = error.error;
            }
          } else {
            this.errorMessage = 'Algunos datos son incorrectos. Verifica la información ingresada.';
          }
        } else if (error.status === 500) {
          this.errorMessage = 'Error interno del servidor. Intenta nuevamente en unos minutos.';
        } else if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
        } else {
          this.errorMessage = error.message || 'Ocurrió un error inesperado. Intenta nuevamente.';
        }

        console.error('❌ Error en registro:', error);
      }
    });
  }
}
