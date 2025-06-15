// /src/app/auth/views/user-register/user-register.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AppInputComponent } from '../../../core/components/app-input/app-input.component';
import { AppButtonComponent } from '../../../core/components/app-button/app-button.component';
import { HttpClient } from '@angular/common/http';
import {SmartLogoComponent} from '../../../core/components/smart-logo/smart-logo.component';

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

    // AuthService ahora maneja todo automáticamente
    // Registra el usuario, inicia sesión y redirige
    this.authService.register(this.registerForm.value);

    // El loading se mantendrá hasta que el usuario sea redirigido
    // AuthService maneja todo internamente
  }
}
