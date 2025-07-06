// supplier-profile-configuration.component.ts - ARREGLADO
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { Supplier } from '../../../supplier/models/supplier.entity';
import { SupplierService } from '../../../supplier/services/supplier.service';
import { AuthService } from '../../../auth/services/auth.service';
import { AppInputComponent } from '../../../core/components/app-input/app-input.component';
import { AppButtonComponent } from '../../../core/components/app-button/app-button.component';
import { AppNotificationComponent } from '../../../core/components/app-notification/app-notification.component';

@Component({
  selector: 'app-supplier-profile-configuration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    AppInputComponent,
    AppButtonComponent,
    AppNotificationComponent
  ],
  templateUrl: './supplier-profile-configuration.component.html',
  styleUrls: ['./supplier-profile-configuration.component.css']
})
export class SupplierProfileConfigurationComponent implements OnInit {
  form!: FormGroup;

  // Estados del componente
  isLoading: boolean = false;
  isSaving: boolean = false;
  // ELIMINADO: isEditMode (siempre es true)

  // Datos del usuario y supplier
  currentUser: any = null;
  supplierProfile: Supplier = new Supplier({});

  // Imagen/Logo
  selectedFile: File | null = null;
  previewUrl: string = '';
  logoUrl: string = '';

  // Listas para selects
  specializationOptions: Array<{label: string, value: any}> = [];

  // API de países y ciudades
  countries: Array<{label: string, value: string}> = [];
  cities: Array<{label: string, value: string}> = [];
  loadingCities = false;

  // Notificación
  notification = {
    show: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'warning' | 'info'
  };

  constructor(
    private fb: FormBuilder,
    private supplierService: SupplierService,
    private authService: AuthService,
    private translate: TranslateService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadCountries();
    this.loadTranslatedLists();
    this.initForm();
    this.loadUserData();
  }

  /**
   * Carga países desde la API
   */
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

  /**
   * Carga ciudades por país
   */
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
          this.cities = [];
        }
      });
  }

  /**
   * Inicializa el formulario reactivo
   */
  initForm() {
    this.form = this.fb.group({
      // Campos de empresa
      companyName: ['', Validators.required],
      ruc: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      specialization: ['', Validators.required],
      description: [''],
      certifications: [''],

      // Campos personales
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      country: ['', Validators.required],
      city: ['', Validators.required],
      address: [''],
      phone: ['']
    });

    // Cargar ciudades cuando cambia el país
    this.form.get('country')?.valueChanges.subscribe(country => {
      if (country) {
        this.loadCitiesByCountry(country);
      } else {
        this.cities = [];
      }
      this.form.get('city')?.setValue('');
    });
  }

  /**
   * Carga las listas traducidas
   */
  private loadTranslatedLists() {
    this.specializationOptions = [
      { value: 'COTTON', label: this.translate.instant('SUPPLIER_PROFILE.SPECIALIZATIONS.COTTON') },
      { value: 'POLYESTER', label: this.translate.instant('SUPPLIER_PROFILE.SPECIALIZATIONS.POLYESTER') },
      { value: 'WOOL', label: this.translate.instant('SUPPLIER_PROFILE.SPECIALIZATIONS.WOOL') },
      { value: 'SILK', label: this.translate.instant('SUPPLIER_PROFILE.SPECIALIZATIONS.SILK') },
      { value: 'LINEN', label: this.translate.instant('SUPPLIER_PROFILE.SPECIALIZATIONS.LINEN') },
      { value: 'BLENDS', label: this.translate.instant('SUPPLIER_PROFILE.SPECIALIZATIONS.BLENDS') },
      { value: 'TECHNICAL', label: this.translate.instant('SUPPLIER_PROFILE.SPECIALIZATIONS.TECHNICAL') },
      { value: 'SUSTAINABLE', label: this.translate.instant('SUPPLIER_PROFILE.SPECIALIZATIONS.SUSTAINABLE') },
      { value: 'OTHER', label: this.translate.instant('SUPPLIER_PROFILE.SPECIALIZATIONS.OTHER') }
    ];
  }

  /**
   * Carga los datos del usuario actual
   */
  loadUserData() {
    this.isLoading = true;
    this.currentUser = this.authService.getCurrentUser();

    if (!this.currentUser) {
      this.showNotification(
        this.translate.instant('SUPPLIER_PROFILE.PROFILE_ERROR'),
        'error'
      );
      this.router.navigate(['/login']);
      return;
    }

    // El perfil SIEMPRE existe (se creó cuando seleccionó rol)
    this.loadSupplierProfile();
  }

  /**
   * Carga el perfil de supplier existente
   */
  loadSupplierProfile() {
    this.supplierService.getProfileById(this.currentUser.id).subscribe({
      next: (profile) => {
        // El perfil SIEMPRE existe, solo actualizamos datos
        this.supplierProfile = new Supplier(profile);
        this.logoUrl = profile.logo || '';
        this.previewUrl = this.logoUrl;

        // Llenar formulario con datos existentes
        this.form.patchValue({
          // Datos de empresa
          companyName: profile.companyName || '',
          ruc: profile.ruc || '',
          specialization: profile.specialization || '',
          description: profile.description || '',
          certifications: profile.certifications || '',

          // Datos personales
          fullName: profile.name || this.currentUser?.name || '',
          email: profile.email || this.currentUser?.email || '',
          country: profile.country || this.currentUser?.country || '',
          city: profile.city || this.currentUser?.city || '',
          address: profile.address || this.currentUser?.address || '',
          phone: profile.phone || this.currentUser?.phone || ''
        });

        // Cargar ciudades si hay país seleccionado
        const country = profile.country || this.currentUser?.country;
        if (country) {
          this.loadCitiesByCountry(country);
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar perfil:', error);
        this.showNotification(
          this.translate.instant('SUPPLIER_PROFILE.PROFILE_ERROR'),
          'error'
        );
        this.isLoading = false;
        this.router.navigate(['/supplier']);
      }
    });
  }

  /**
   * Activa el input de archivo
   */
  triggerFileInput() {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  /**
   * Maneja la selección de archivo
   */
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      this.showNotification(
        this.translate.instant('SUPPLIER_PROFILE.INVALID_IMAGE_TYPE'),
        'warning'
      );
      event.target.value = '';
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.showNotification(
        this.translate.instant('SUPPLIER_PROFILE.IMAGE_TOO_LARGE'),
        'warning'
      );
      event.target.value = '';
      return;
    }

    this.selectedFile = file;

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewUrl = e.target.result;
    };
    reader.readAsDataURL(file);

    event.target.value = '';
  }

  /**
   * Elimina la imagen seleccionada
   */
  removeImage() {
    // Limpiar preview local
    this.selectedFile = null;
    this.previewUrl = '';

    // Si hay una imagen existente en el backend, eliminarla
    if (this.logoUrl) {
      this.supplierService.deleteLogo(this.currentUser.id).subscribe({
        next: (response) => {
          this.logoUrl = '';
          this.supplierProfile.logo = '';

          this.showNotification(
            this.translate.instant('SUPPLIER_PROFILE.IMAGE_DELETED'),
            'success'
          );
        },
        error: (error) => {
          console.error('Error eliminando logo:', error);
          // Limpiar localmente de todas formas
          this.logoUrl = '';
          this.supplierProfile.logo = '';

          this.showNotification(
            this.translate.instant('SUPPLIER_PROFILE.DELETE_ERROR'),
            'error'
          );
        }
      });
    }
  }

  /**
   * Sube imagen al backend
   */
  private uploadImage(): Promise<string> {
    if (!this.selectedFile) {
      return Promise.resolve(this.logoUrl);
    }

    return new Promise((resolve, reject) => {
      this.supplierService.uploadLogo(this.currentUser.id, this.selectedFile!).subscribe({
        next: (response) => {
          resolve(response.logoUrl || '');
        },
        error: (error) => {
          console.error('Error subiendo imagen:', error);
          this.showNotification(
            this.translate.instant('SUPPLIER_PROFILE.UPLOAD_ERROR'),
            'error'
          );
          resolve(this.logoUrl);
        }
      });
    });
  }

  /**
   * Valida el formulario
   */
  private validateForm(): boolean {
    const formValues = this.form.getRawValue();

    if (!formValues.companyName?.trim()) {
      this.showNotification(
        this.translate.instant('SUPPLIER_PROFILE.COMPANY_NAME_REQUIRED'),
        'warning'
      );
      return false;
    }

    if (!formValues.ruc?.trim()) {
      this.showNotification(
        this.translate.instant('SUPPLIER_PROFILE.RUC_REQUIRED'),
        'warning'
      );
      return false;
    }

    if (!formValues.specialization?.trim()) {
      this.showNotification(
        this.translate.instant('SUPPLIER_PROFILE.SPECIALIZATION_REQUIRED'),
        'warning'
      );
      return false;
    }

    if (!formValues.fullName?.trim()) {
      this.showNotification(
        this.translate.instant('SUPPLIER_PROFILE.FULL_NAME_REQUIRED'),
        'warning'
      );
      return false;
    }

    if (!formValues.email?.trim()) {
      this.showNotification(
        this.translate.instant('SUPPLIER_PROFILE.EMAIL_REQUIRED'),
        'warning'
      );
      return false;
    }

    if (!formValues.country?.trim()) {
      this.showNotification(
        this.translate.instant('SUPPLIER_PROFILE.COUNTRY_REQUIRED'),
        'warning'
      );
      return false;
    }

    if (!formValues.city?.trim()) {
      this.showNotification(
        this.translate.instant('SUPPLIER_PROFILE.CITY_REQUIRED'),
        'warning'
      );
      return false;
    }

    // Validar RUC (formato para Perú)
    if (formValues.ruc && !/^\d{11}$/.test(formValues.ruc)) {
      this.showNotification(
        this.translate.instant('SUPPLIER_PROFILE.INVALID_RUC'),
        'warning'
      );
      return false;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formValues.email && !emailRegex.test(formValues.email)) {
      this.showNotification(
        this.translate.instant('SUPPLIER_PROFILE.INVALID_EMAIL'),
        'warning'
      );
      return false;
    }

    return true;
  }

  /**
   * Guarda el perfil - SIMPLIFICADO (solo UPDATE)
   */
  async saveProfile() {
    if (!this.validateForm() || this.isSaving) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;

    try {
      const formValues = this.form.getRawValue();

      // Actualizar datos del objeto
      this.supplierProfile.companyName = formValues.companyName;
      this.supplierProfile.ruc = formValues.ruc;
      this.supplierProfile.specialization = formValues.specialization;
      this.supplierProfile.description = formValues.description;
      this.supplierProfile.certifications = formValues.certifications;

      // Actualizar datos personales
      this.supplierProfile.name = formValues.fullName;
      this.supplierProfile.email = formValues.email;
      this.supplierProfile.country = formValues.country;
      this.supplierProfile.city = formValues.city;
      this.supplierProfile.address = formValues.address;
      this.supplierProfile.phone = formValues.phone;

      // Subir imagen si hay una seleccionada
      if (this.selectedFile) {
        this.supplierProfile.logo = await this.uploadImage();
      }

      // SOLO UPDATE (el perfil siempre existe)
      this.supplierService.updateProfile(this.supplierProfile.id!, this.supplierProfile).subscribe({
        next: (updatedProfile) => {
          this.showNotification(
            this.translate.instant('SUPPLIER_PROFILE.PROFILE_UPDATED_SUCCESS'),
            'success'
          );

          // Actualizar datos locales
          this.supplierProfile = new Supplier(updatedProfile);
          this.logoUrl = updatedProfile.logo || '';
          this.selectedFile = null;
          this.isSaving = false;
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          this.showNotification(
            this.translate.instant('SUPPLIER_PROFILE.PROFILE_ERROR'),
            'error'
          );
          this.isSaving = false;
        }
      });
    } catch (error) {
      console.error('Error processing profile:', error);
      this.showNotification(
        this.translate.instant('SUPPLIER_PROFILE.PROFILE_ERROR'),
        'error'
      );
      this.isSaving = false;
    }
  }

  /**
   * Navega de vuelta al dashboard
   */
  goBack() {
    this.router.navigate(['/supplier']);
  }

  /**
   * Muestra notificación
   */
  showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info') {
    this.notification = {
      show: true,
      message,
      type
    };
  }

  /**
   * Cierra notificación
   */
  closeNotification() {
    this.notification.show = false;
  }
}
