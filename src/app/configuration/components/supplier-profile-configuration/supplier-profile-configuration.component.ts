import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../auth/services/auth.service';
import { SupplierService } from '../../../supplier/services/supplier.service';
import { Supplier } from '../../../supplier/models/supplier.entity';
import { Router } from '@angular/router';

@Component({
  selector: 'app-supplier-profile-configuration',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './supplier-profile-configuration.component.html',
  styleUrl: './supplier-profile-configuration.component.css'
})
export class SupplierProfileConfigurationComponent implements OnInit {
  profileForm!: FormGroup;
  userId!: number;
  supplier!: Supplier;
  isSaving = false;
  saveSuccess = false;
  saveError = false;
  imagePreview: string | null = null;
  
  // Specializations for dropdown
  specializations = [
    'Materias Primas',
    'Componentes Electrónicos',
    'Textiles',
    'Alimentos',
    'Productos Químicos',
    'Maquinaria',
    'Embalaje',
    'Servicios Logísticos',
    'Otro'
  ];
  
  // Product categories for dropdown
  productCategories = [
    'Electrónica',
    'Ropa y Textiles',
    'Alimentos y Bebidas',
    'Productos Químicos',
    'Maquinaria Industrial',
    'Materiales de Construcción',
    'Productos Médicos',
    'Autopartes',
    'Plásticos y Polímeros',
    'Otro'
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private supplierService: SupplierService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'supplier') {
      this.router.navigate(['/login']);
      return;
    }

    this.userId = currentUser.id;

    // Initialize form with validators
    this.profileForm = this.fb.group({
      companyName: ['', [Validators.required, Validators.minLength(2)]],
      ruc: ['', [Validators.required, Validators.pattern(/^[0-9]{11}$/)]],
      specialization: ['', Validators.required],
      productCategories: [[], Validators.required],
      yearsFounded: [new Date().getFullYear(), [
        Validators.required, 
        Validators.min(1900), 
        Validators.max(new Date().getFullYear())
      ]],
      warehouseLocation: ['', Validators.required],
      minimumOrderQuantity: [0, [Validators.required, Validators.min(0)]],
      logo: ['']
    });

    // Load supplier profile
    this.loadSupplierProfile();
  }

  loadSupplierProfile(): void {
    this.supplierService.getProfileByUserId(this.userId, (profile: Supplier) => {
      if (profile) {
        this.supplier = profile;
        this.updateFormWithProfile(profile);
        if (profile.logo) {
          this.imagePreview = profile.logo;
        }
      } else {
        console.error('No se encontró el perfil de proveedor');
      }
    });
  }

  updateFormWithProfile(profile: Supplier): void {
    this.profileForm.patchValue({
      companyName: profile.companyName,
      ruc: profile.ruc,
      specialization: profile.specialization,
      productCategories: profile.productCategories,
      yearsFounded: profile.yearsFounded,
      warehouseLocation: profile.warehouseLocation,
      minimumOrderQuantity: profile.minimumOrderQuantity,
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

    // Create updated supplier object
    const updatedSupplier = {
      ...this.supplier,
      ...this.profileForm.value
    };

    // Save profile
    this.supplierService.update(updatedSupplier.id, updatedSupplier)
      .subscribe({
        next: (savedProfile) => {
          this.supplier = savedProfile;
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
