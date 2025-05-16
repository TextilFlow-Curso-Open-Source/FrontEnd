import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../auth/services/auth.service';
import { BusinessmanService } from '../../../businessman/services/businessman.service';
import { Businessman } from '../../../businessman/models/businessman.entity';
import { Router } from '@angular/router';

@Component({
  selector: 'app-businessman-profile-configuration',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './businessman-profile-configuration.component.html',
  styleUrl: './businessman-profile-configuration.component.css'
})
export class BusinessmanProfileConfigurationComponent implements OnInit {
  profileForm!: FormGroup;
  userId!: number;
  businessman!: Businessman;
  isSaving = false;
  saveSuccess = false;
  saveError = false;
  imagePreview: string | null = null;
  
  // Business types for dropdown
  businessTypes = [
    'Startup',
    'Pequeña Empresa',
    'Mediana Empresa',
    'Gran Empresa',
    'Corporación',
    'Autónomo'
  ];
  
  // Industries for dropdown
  industries = [
    'Tecnología',
    'Finanzas',
    'Salud',
    'Educación',
    'Comercio',
    'Manufactura',
    'Servicios',
    'Construcción',
    'Transporte',
    'Alimentación',
    'Otro'
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private businessmanService: BusinessmanService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'businessman') {
      this.router.navigate(['/login']);
      return;
    }

    this.userId = currentUser.id;

    // Initialize form with validators
    this.profileForm = this.fb.group({
      companyName: ['', [Validators.required, Validators.minLength(2)]],
      ruc: ['', [Validators.required, Validators.pattern(/^[0-9]{11}$/)]],
      businessType: ['', Validators.required],
      industry: ['', Validators.required],
      employeeCount: [0, [Validators.required, Validators.min(1)]],
      foundingYear: [new Date().getFullYear(), [
        Validators.required, 
        Validators.min(1900), 
        Validators.max(new Date().getFullYear())
      ]],
      website: ['', Validators.pattern(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/)],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      logo: ['']
    });

    // Load businessman profile
    this.loadBusinessmanProfile();
  }

  loadBusinessmanProfile(): void {
    this.businessmanService.getProfileByUserId(this.userId, (profile: Businessman) => {
      if (profile) {
        this.businessman = profile;
        this.updateFormWithProfile(profile);
        if (profile.logo) {
          this.imagePreview = profile.logo;
        }
      } else {
        console.error('No se encontró el perfil de empresario');
      }
    });
  }

  updateFormWithProfile(profile: Businessman): void {
    this.profileForm.patchValue({
      companyName: profile.companyName,
      ruc: profile.ruc,
      businessType: profile.businessType,
      industry: profile.industry,
      employeeCount: profile.employeeCount,
      foundingYear: profile.foundingYear,
      website: profile.website,
      description: profile.description,
      logo: profile.logo
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      const reader = new FileReader();
      
      reader.onload = () => {
        this.imagePreview = reader.result as string;
        this.profileForm.patchValue({
          logo: reader.result
        });
      };
      
      reader.readAsDataURL(file);
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.profileForm.controls).forEach(key => {
        const control = this.profileForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isSaving = true;
    this.saveSuccess = false;
    this.saveError = false;

    // Create updated businessman object
    const updatedBusinessman = {
      ...this.businessman,
      ...this.profileForm.value
    };

    // Save profile
    this.businessmanService.update(updatedBusinessman.id, updatedBusinessman)
      .subscribe({
        next: (savedProfile) => {
          this.businessman = savedProfile;
          this.isSaving = false;
          this.saveSuccess = true;
          setTimeout(() => this.saveSuccess = false, 3000);
        },
        error: (error) => {
          console.error('Error saving profile:', error);
          this.isSaving = false;
          this.saveError = true;
          setTimeout(() => this.saveError = false, 3000);
        }
      });
  }

  // Helper method to check if a field is invalid and touched
  isFieldInvalid(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  // Helper method to get error message for a field
  getErrorMessage(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    if (!field) return '';
    
    if (field.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    
    if (field.hasError('minlength')) {
      const requiredLength = field.errors?.['minlength'].requiredLength;
      return `Debe tener al menos ${requiredLength} caracteres`;
    }
    
    if (field.hasError('maxlength')) {
      const requiredLength = field.errors?.['maxlength'].requiredLength;
      return `No puede tener más de ${requiredLength} caracteres`;
    }
    
    if (field.hasError('pattern')) {
      if (fieldName === 'ruc') {
        return 'El RUC debe tener 11 dígitos numéricos';
      }
      if (fieldName === 'website') {
        return 'Ingrese una URL válida';
      }
      return 'Formato inválido';
    }
    
    if (field.hasError('min')) {
      const min = field.errors?.['min'].min;
      return `El valor mínimo es ${min}`;
    }
    
    if (field.hasError('max')) {
      const max = field.errors?.['max'].max;
      return `El valor máximo es ${max}`;
    }
    
    return 'Campo inválido';
  }
}
