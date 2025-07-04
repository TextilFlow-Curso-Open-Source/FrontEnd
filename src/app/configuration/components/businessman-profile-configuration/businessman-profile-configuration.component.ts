// businessman-profile-configuration.component.ts - ARREGLADO
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BusinessmanService} from '../../../businessman/services/businessman.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Businessman} from '../../../businessman/models/businessman.entity';
import { AppInputComponent } from '../../../core/components/app-input/app-input.component';
import { AppButtonComponent } from '../../../core/components/app-button/app-button.component';
import { AppNotificationComponent } from '../../../core/components/app-notification/app-notification.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-businessman-profile-configuration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppInputComponent,
    AppButtonComponent,
    AppNotificationComponent,
    TranslateModule
  ],
  templateUrl: './businessman-profile-configuration.component.html',
  styleUrls: ['./businessman-profile-configuration.component.css']
})
export class BusinessmanProfileConfigurationComponent implements OnInit {
  form!: FormGroup;

  // Estados del componente
  isLoading: boolean = false;
  isSaving: boolean = false;
  // ELIMINADO: isEditMode (siempre es true)

  // Datos del usuario y businessman
  currentUser: any = null;
  businessmanProfile: Businessman = new Businessman({});

  // Imagen/Logo
  selectedFile: File | null = null;
  previewUrl: string = '';
  logoUrl: string = '';

  // Listas para selects
  businessTypes: Array<{label: string, value: any}> = [];

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
    private businessmanService: BusinessmanService,
    private authService: AuthService,
    private router: Router,
    private translate: TranslateService,
    private http: HttpClient
  ) {}

  ngOnInit() {
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
      businessType: ['', Validators.required],
      website: [''],
      description: [''],

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
    this.businessTypes = [
      { value: 'MANUFACTURING', label: this.translate.instant('BUSINESSMAN_PROFILE.BUSINESS_TYPES.MANUFACTURING') },
      { value: 'TEXTILE_DISTRIBUTION', label: this.translate.instant('BUSINESSMAN_PROFILE.BUSINESS_TYPES.TEXTILE_DISTRIBUTION') },
      { value: 'FABRIC_WHOLESALE', label: this.translate.instant('BUSINESSMAN_PROFILE.BUSINESS_TYPES.FABRIC_WHOLESALE') },
      { value: 'GARMENT_PRODUCTION', label: this.translate.instant('BUSINESSMAN_PROFILE.BUSINESS_TYPES.GARMENT_PRODUCTION') },
      { value: 'FASHION_RETAIL', label: this.translate.instant('BUSINESSMAN_PROFILE.BUSINESS_TYPES.FASHION_RETAIL') },
      { value: 'TEXTILE_IMPORT_EXPORT', label: this.translate.instant('BUSINESSMAN_PROFILE.BUSINESS_TYPES.TEXTILE_IMPORT_EXPORT') },
      { value: 'COMMERCIAL_SERVICES', label: this.translate.instant('BUSINESSMAN_PROFILE.BUSINESS_TYPES.COMMERCIAL_SERVICES') },
      { value: 'TECHNOLOGY', label: this.translate.instant('BUSINESSMAN_PROFILE.BUSINESS_TYPES.TECHNOLOGY') },
      { value: 'OTHER', label: this.translate.instant('BUSINESSMAN_PROFILE.BUSINESS_TYPES.OTHER') }
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
        this.translate.instant('BUSINESSMAN_PROFILE.PROFILE_ERROR'),
        'error'
      );
      this.router.navigate(['/login']);
      return;
    }

    // El perfil SIEMPRE existe (se creó cuando seleccionó rol)
    this.loadBusinessmanProfile();
  }

  /**
   * Carga el perfil de businessman existente
   */
  loadBusinessmanProfile() {
    this.businessmanService.getProfileById(this.currentUser.id).subscribe({
      next: (profile) => {
        // El perfil SIEMPRE existe, solo actualizamos datos
        this.businessmanProfile = new Businessman(profile);
        this.logoUrl = profile.logo || '';
        this.previewUrl = this.logoUrl;

        // Llenar formulario con datos existentes
        this.form.patchValue({
          // Datos de empresa
          companyName: profile.companyName || '',
          ruc: profile.ruc || '',
          businessType: profile.businessType || '',
          website: profile.website || '',
          description: profile.description || '',

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
          this.translate.instant('BUSINESSMAN_PROFILE.PROFILE_ERROR'),
          'error'
        );
        this.isLoading = false;
        this.router.navigate(['/businessman']);
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
        this.translate.instant('BUSINESSMAN_PROFILE.INVALID_IMAGE_TYPE'),
        'warning'
      );
      event.target.value = '';
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.showNotification(
        this.translate.instant('BUSINESSMAN_PROFILE.IMAGE_TOO_LARGE'),
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
      this.businessmanService.deleteLogo(this.currentUser.id).subscribe({
        next: (response) => {
          this.logoUrl = '';
          this.businessmanProfile.logo = '';

          this.showNotification(
            this.translate.instant('BUSINESSMAN_PROFILE.IMAGE_DELETED'),
            'success'
          );
        },
        error: (error) => {
          console.error('Error eliminando logo:', error);
          // Limpiar localmente de todas formas
          this.logoUrl = '';
          this.businessmanProfile.logo = '';

          this.showNotification(
            this.translate.instant('BUSINESSMAN_PROFILE.DELETE_ERROR'),
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
      this.businessmanService.uploadLogo(this.currentUser.id, this.selectedFile!).subscribe({
        next: (response) => {
          resolve(response.logoUrl || '');
        },
        error: (error) => {
          console.error('Error subiendo imagen:', error);
          this.showNotification(
            this.translate.instant('BUSINESSMAN_PROFILE.UPLOAD_ERROR'),
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
        this.translate.instant('BUSINESSMAN_PROFILE.COMPANY_NAME_REQUIRED'),
        'warning'
      );
      return false;
    }

    if (!formValues.ruc?.trim()) {
      this.showNotification(
        this.translate.instant('BUSINESSMAN_PROFILE.RUC_REQUIRED'),
        'warning'
      );
      return false;
    }

    if (!formValues.businessType?.trim()) {
      this.showNotification(
        this.translate.instant('BUSINESSMAN_PROFILE.BUSINESS_TYPE_REQUIRED'),
        'warning'
      );
      return false;
    }

    if (!formValues.fullName?.trim()) {
      this.showNotification(
        this.translate.instant('BUSINESSMAN_PROFILE.FULL_NAME_REQUIRED'),
        'warning'
      );
      return false;
    }

    if (!formValues.email?.trim()) {
      this.showNotification(
        this.translate.instant('BUSINESSMAN_PROFILE.EMAIL_REQUIRED'),
        'warning'
      );
      return false;
    }

    if (!formValues.country?.trim()) {
      this.showNotification(
        this.translate.instant('BUSINESSMAN_PROFILE.COUNTRY_REQUIRED'),
        'warning'
      );
      return false;
    }

    if (!formValues.city?.trim()) {
      this.showNotification(
        this.translate.instant('BUSINESSMAN_PROFILE.CITY_REQUIRED'),
        'warning'
      );
      return false;
    }

    // Validar RUC (formato para Perú)
    if (formValues.ruc && !/^\d{11}$/.test(formValues.ruc)) {
      this.showNotification(
        this.translate.instant('BUSINESSMAN_PROFILE.INVALID_RUC'),
        'warning'
      );
      return false;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formValues.email && !emailRegex.test(formValues.email)) {
      this.showNotification(
        this.translate.instant('BUSINESSMAN_PROFILE.INVALID_EMAIL'),
        'warning'
      );
      return false;
    }

    // Validar website si se proporciona
    if (formValues.website && !this.isValidUrl(formValues.website)) {
      this.showNotification(
        this.translate.instant('BUSINESSMAN_PROFILE.INVALID_WEBSITE'),
        'warning'
      );
      return false;
    }

    return true;
  }

  /**
   * Valida si una URL es válida
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Guarda el perfil - SIMPLIFICADO (solo UPDATE)
   */
  async saveProfile() {
    console.log('🔄 Iniciando saveProfile...');

    if (!this.form.valid || !this.validateForm() || this.isSaving) {
      console.log('❌ Formulario inválido o ya guardando');
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    console.log('📝 Actualizando perfil...');

    try {
      const formValues = this.form.getRawValue();
      console.log('📋 Valores del formulario:', formValues);

      // Actualizar datos del objeto
      this.businessmanProfile.companyName = formValues.companyName;
      this.businessmanProfile.ruc = formValues.ruc;
      this.businessmanProfile.businessType = formValues.businessType;
      this.businessmanProfile.website = formValues.website;
      this.businessmanProfile.description = formValues.description;

      // Actualizar datos personales
      this.businessmanProfile.name = formValues.fullName;
      this.businessmanProfile.email = formValues.email;
      this.businessmanProfile.country = formValues.country;
      this.businessmanProfile.city = formValues.city;
      this.businessmanProfile.address = formValues.address;
      this.businessmanProfile.phone = formValues.phone;

      // Subir imagen si hay una seleccionada
      if (this.selectedFile) {
        console.log('📤 Subiendo imagen...');
        this.businessmanProfile.logo = await this.uploadImage();
        console.log('✅ Imagen subida, URL:', this.businessmanProfile.logo);
      }

      console.log('📊 Perfil a actualizar:', this.businessmanProfile);

      // SOLO UPDATE (el perfil siempre existe)
      this.businessmanService.updateProfile(this.businessmanProfile.id!, this.businessmanProfile).subscribe({
        next: (updatedProfile) => {
          console.log('✅ Perfil actualizado exitosamente:', updatedProfile);
          this.showNotification(
            this.translate.instant('BUSINESSMAN_PROFILE.PROFILE_UPDATED_SUCCESS'),
            'success'
          );

          // Actualizar datos locales
          this.businessmanProfile = new Businessman(updatedProfile);
          this.logoUrl = updatedProfile.logo || '';
          this.selectedFile = null;
          this.isSaving = false;
        },
        error: (error) => {
          console.error('❌ Error updating profile:', error);
          this.showNotification(
            this.translate.instant('BUSINESSMAN_PROFILE.PROFILE_ERROR'),
            'error'
          );
          this.isSaving = false;
        }
      });
    } catch (error) {
      console.error('❌ Error processing profile:', error);
      this.showNotification(
        this.translate.instant('BUSINESSMAN_PROFILE.PROFILE_ERROR'),
        'error'
      );
      this.isSaving = false;
    }
  }

  /**
   * Navega de vuelta al dashboard
   */
  goBack() {
    this.router.navigate(['/businessman']);
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
