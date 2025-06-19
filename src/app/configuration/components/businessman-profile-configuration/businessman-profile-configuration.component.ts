// businessman-profile-configuration.component.ts - LIMPIO Y CORREGIDO
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
  isEditMode: boolean = false;

  // Datos del usuario y businessman
  currentUser: any = null;
  businessmanProfile: Businessman = new Businessman({});

  // Imagen/Logo
  selectedFile: File | null = null;
  previewUrl: string = '';
  logoUrl: string = '';

  // Listas para selects (compatible con app-input)
  businessTypes: Array<{label: string, value: any}> = [];
  industries: Array<{label: string, value: any}> = [];
  employeeRanges: Array<{label: string, value: any}> = [];
  years: Array<{label: string, value: any}> = [];

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
      // Campos de la empresa
      companyName: ['', Validators.required],
      ruc: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      businessType: ['', Validators.required],
      industry: ['', Validators.required],
      employeeCount: [''],
      foundingYear: [new Date().getFullYear()],
      website: [''],
      description: [''],

      // Campos personales - EDITABLES
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
   * Carga las listas traducidas compatible con app-input
   */
  private loadTranslatedLists() {
    // Tipos de negocio con traducción directa
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

    // Industrias específicas del sector textil
    this.industries = [
      { value: 'COTTON_FABRICS', label: this.translate.instant('BUSINESSMAN_PROFILE.INDUSTRIES.COTTON_FABRICS') },
      { value: 'SYNTHETIC_FABRICS', label: this.translate.instant('BUSINESSMAN_PROFILE.INDUSTRIES.SYNTHETIC_FABRICS') },
      { value: 'LUXURY_FABRICS', label: this.translate.instant('BUSINESSMAN_PROFILE.INDUSTRIES.LUXURY_FABRICS') },
      { value: 'INDUSTRIAL_TEXTILES', label: this.translate.instant('BUSINESSMAN_PROFILE.INDUSTRIES.INDUSTRIAL_TEXTILES') },
      { value: 'HOME_TEXTILES', label: this.translate.instant('BUSINESSMAN_PROFILE.INDUSTRIES.HOME_TEXTILES') },
      { value: 'FASHION_FABRICS', label: this.translate.instant('BUSINESSMAN_PROFILE.INDUSTRIES.FASHION_FABRICS') },
      { value: 'SPORTS_TEXTILES', label: this.translate.instant('BUSINESSMAN_PROFILE.INDUSTRIES.SPORTS_TEXTILES') },
      { value: 'MEDICAL_TEXTILES', label: this.translate.instant('BUSINESSMAN_PROFILE.INDUSTRIES.MEDICAL_TEXTILES') },
      { value: 'AUTOMOTIVE_TEXTILES', label: this.translate.instant('BUSINESSMAN_PROFILE.INDUSTRIES.AUTOMOTIVE_TEXTILES') },
      { value: 'ECO_FRIENDLY_TEXTILES', label: this.translate.instant('BUSINESSMAN_PROFILE.INDUSTRIES.ECO_FRIENDLY_TEXTILES') },
      { value: 'OTHER', label: this.translate.instant('BUSINESSMAN_PROFILE.INDUSTRIES.OTHER') }
    ];

    // Rangos de empleados traducidos
    this.employeeRanges = [
      { value: '1-10', label: this.translate.instant('BUSINESSMAN_PROFILE.EMPLOYEE_RANGES.RANGE_1_TO_10') },
      { value: '11-50', label: this.translate.instant('BUSINESSMAN_PROFILE.EMPLOYEE_RANGES.RANGE_11_TO_50') },
      { value: '51-200', label: this.translate.instant('BUSINESSMAN_PROFILE.EMPLOYEE_RANGES.RANGE_51_TO_200') },
      { value: '201-500', label: this.translate.instant('BUSINESSMAN_PROFILE.EMPLOYEE_RANGES.RANGE_201_TO_500') },
      { value: '501-1000', label: this.translate.instant('BUSINESSMAN_PROFILE.EMPLOYEE_RANGES.RANGE_501_TO_1000') },
      { value: '1000+', label: this.translate.instant('BUSINESSMAN_PROFILE.EMPLOYEE_RANGES.RANGE_1000_PLUS') }
    ];

    // Generar años para select
    const currentYear = new Date().getFullYear();
    this.years = [];
    for (let year = currentYear; year >= 1950; year--) {
      this.years.push({
        value: year,
        label: year.toString()
      });
    }
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

    // Cargar perfil de businessman si existe
    this.loadBusinessmanProfile();
  }

  /**
   * Carga el perfil de businessman
   */
  loadBusinessmanProfile() {
    this.businessmanService.getProfileById(this.currentUser.id).subscribe({
      next: (profile) => {
        if (profile) {
          this.businessmanProfile = new Businessman(profile);
          this.logoUrl = profile.logo || '';
          this.previewUrl = this.logoUrl;
          this.isEditMode = true;

          // Cargar datos del perfil al formulario
          this.form.patchValue({
            // Datos de la empresa
            companyName: profile.companyName || '',
            ruc: profile.ruc || '',
            businessType: profile.businessType || '',
            industry: profile.industry || '',
            employeeCount: profile.employeeCount || '',
            foundingYear: profile.foundingYear || new Date().getFullYear(),
            website: profile.website || '',
            description: profile.description || '',

            // Datos personales del perfil o usuario actual
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
        } else {
          // No existe perfil, crear uno nuevo con datos del usuario
          this.businessmanProfile = new Businessman({
            id: this.currentUser.id,
            name: this.currentUser.name,
            email: this.currentUser.email,
            role: 'businessman',
            country: this.currentUser.country,
            city: this.currentUser.city,
            address: this.currentUser.address,
            phone: this.currentUser.phone,
            foundingYear: new Date().getFullYear()
          });
          this.isEditMode = false;

          // Cargar datos del usuario en el formulario
          this.form.patchValue({
            fullName: this.currentUser?.name || '',
            email: this.currentUser?.email || '',
            country: this.currentUser?.country || '',
            city: this.currentUser?.city || '',
            address: this.currentUser?.address || '',
            phone: this.currentUser?.phone || ''
          });

          // Cargar ciudades si hay país
          if (this.currentUser?.country) {
            this.loadCitiesByCountry(this.currentUser.country);
          }
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar perfil:', error);
        // Si no existe, crear uno nuevo
        this.businessmanProfile = new Businessman({
          id: this.currentUser.id,
          name: this.currentUser.name,
          email: this.currentUser.email,
          role: 'businessman',
          country: this.currentUser.country,
          city: this.currentUser.city,
          address: this.currentUser.address,
          phone: this.currentUser.phone,
          foundingYear: new Date().getFullYear()
        });

        // Cargar datos del usuario actual
        this.form.patchValue({
          fullName: this.currentUser?.name || '',
          email: this.currentUser?.email || '',
          country: this.currentUser?.country || '',
          city: this.currentUser?.city || '',
          address: this.currentUser?.address || '',
          phone: this.currentUser?.phone || ''
        });

        // Cargar ciudades si hay país
        if (this.currentUser?.country) {
          this.loadCitiesByCountry(this.currentUser.country);
        }

        this.isEditMode = false;
        this.isLoading = false;
      }
    });
  }

  /**
   * Activa el input de archivo de forma controlada
   */
  triggerFileInput() {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  /**
   * Maneja la selección de archivo - CORREGIDO
   */
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) {
      return; // Si no hay archivo, no hacer nada
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      this.showNotification(
        this.translate.instant('BUSINESSMAN_PROFILE.INVALID_IMAGE_TYPE'),
        'warning'
      );
      // Limpiar el input
      event.target.value = '';
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.showNotification(
        this.translate.instant('BUSINESSMAN_PROFILE.IMAGE_TOO_LARGE'),
        'warning'
      );
      // Limpiar el input
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

    // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
    event.target.value = '';
  }

  /**
   * Elimina la imagen seleccionada
   */
  removeImage() {
    this.selectedFile = null;
    this.previewUrl = '';
    this.logoUrl = '';
    this.businessmanProfile.logo = '';
  }

  /**
   * Simula la subida de imagen
   */
  private async uploadImage(): Promise<string> {
    if (!this.selectedFile) {
      return this.logoUrl;
    }

    // Simular subida de imagen
    return new Promise((resolve) => {
      setTimeout(() => {
        const formData = this.form.getRawValue();
        const companyName = formData.companyName || 'Company';
        const fakeUrl = `https://via.placeholder.com/300x300/a68b6b/ffffff?text=${encodeURIComponent(companyName)}`;
        resolve(fakeUrl);
      }, 1000);
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

    if (!formValues.industry?.trim()) {
      this.showNotification(
        this.translate.instant('BUSINESSMAN_PROFILE.INDUSTRY_REQUIRED'),
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

    // Validar RUC (formato básico para Perú)
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
   * Guarda el perfil
   */
  /**
   * Guarda el perfil - CORREGIDO para actualizar ambas tablas
   */
  async saveProfile() {
    if (!this.form.valid || !this.validateForm() || this.isSaving) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;

    try {
      const formValues = this.form.getRawValue();

      // Actualizar el objeto businessman con los valores del formulario
      this.businessmanProfile.companyName = formValues.companyName;
      this.businessmanProfile.ruc = formValues.ruc;
      this.businessmanProfile.businessType = formValues.businessType;
      this.businessmanProfile.industry = formValues.industry;
      this.businessmanProfile.employeeCount = formValues.employeeCount;
      this.businessmanProfile.foundingYear = formValues.foundingYear;
      this.businessmanProfile.website = formValues.website;
      this.businessmanProfile.description = formValues.description;

      // Actualizar datos personales EN EL BUSINESSMAN
      this.businessmanProfile.name = formValues.fullName;
      this.businessmanProfile.email = formValues.email;
      this.businessmanProfile.country = formValues.country;
      this.businessmanProfile.city = formValues.city;
      this.businessmanProfile.address = formValues.address;
      this.businessmanProfile.phone = formValues.phone;

      // Subir imagen si hay una seleccionada
      if (this.selectedFile) {
        this.businessmanProfile.logo = await this.uploadImage();
      }

      if (this.isEditMode) {
        // ===== ACTUALIZAR PERFIL EXISTENTE =====

        // 1. Actualizar tabla businessman
        this.businessmanService.updateProfile(this.businessmanProfile.id!, this.businessmanProfile).subscribe({
          next: (updatedProfile) => {
            console.log('✅ Businessman profile updated:', updatedProfile);

            // 2. Preparar datos para actualizar tabla users
            const updatedUserData = {
              id: this.currentUser.id,
              name: formValues.fullName,
              email: formValues.email,
              country: formValues.country,
              city: formValues.city,
              address: formValues.address,
              phone: formValues.phone,
              // Mantener datos existentes
              password: this.currentUser.password,
              role: this.currentUser.role
            };

            // 3. Actualizar tabla users
            this.authService.updateUser(this.currentUser.id, updatedUserData).subscribe({
              next: (updatedUser) => {
                console.log('✅ User data updated:', updatedUser);

                // 4. Actualizar usuario actual en el servicio
                this.authService.setCurrentUser(updatedUser);

                // 5. Mostrar éxito y limpiar
                this.showNotification(
                  this.translate.instant('BUSINESSMAN_PROFILE.PROFILE_UPDATED_SUCCESS'),
                  'success'
                );
                this.businessmanProfile = new Businessman(updatedProfile);
                this.logoUrl = updatedProfile.logo || '';
                this.selectedFile = null;
                this.isSaving = false;
              },
              error: (userError) => {
                console.error('❌ Error updating user data:', userError);
                this.showNotification(
                  this.translate.instant('BUSINESSMAN_PROFILE.USER_UPDATE_ERROR'),
                  'warning'
                );
                // Aunque falle la actualización del usuario, el businessman se actualizó
                this.businessmanProfile = new Businessman(updatedProfile);
                this.logoUrl = updatedProfile.logo || '';
                this.selectedFile = null;
                this.isSaving = false;
              }
            });
          },
          error: (error) => {
            console.error('❌ Error updating businessman profile:', error);
            this.showNotification(
              this.translate.instant('BUSINESSMAN_PROFILE.PROFILE_ERROR'),
              'error'
            );
            this.isSaving = false;
          }
        });

      } else {
        // ===== CREAR NUEVO PERFIL =====

        this.businessmanService.createProfile(this.currentUser.id).subscribe({
          next: (newProfile) => {
            const completeProfile = new Businessman({
              ...newProfile,
              ...this.businessmanProfile
            });

            // 1. Completar perfil businessman
            this.businessmanService.updateProfile(newProfile.id!, completeProfile).subscribe({
              next: (updatedProfile) => {
                console.log('✅ New businessman profile created:', updatedProfile);

                // 2. Preparar datos para actualizar tabla users
                const updatedUserData = {
                  id: this.currentUser.id,
                  name: formValues.fullName,
                  email: formValues.email,
                  country: formValues.country,
                  city: formValues.city,
                  address: formValues.address,
                  phone: formValues.phone,
                  // Mantener datos existentes
                  password: this.currentUser.password,
                  role: this.currentUser.role
                };

                // 3. Actualizar tabla users
                this.authService.updateUser(this.currentUser.id, updatedUserData).subscribe({
                  next: (updatedUser) => {
                    console.log('✅ User data updated:', updatedUser);

                    // 4. Actualizar usuario actual en el servicio
                    this.authService.setCurrentUser(updatedUser);

                    // 5. Mostrar éxito y limpiar
                    this.showNotification(
                      this.translate.instant('BUSINESSMAN_PROFILE.PROFILE_CREATED_SUCCESS'),
                      'success'
                    );
                    this.businessmanProfile = new Businessman(updatedProfile);
                    this.logoUrl = updatedProfile.logo || '';
                    this.selectedFile = null;
                    this.isEditMode = true;
                    this.isSaving = false;
                  },
                  error: (userError) => {
                    console.error('❌ Error updating user data:', userError);
                    this.showNotification(
                      this.translate.instant('BUSINESSMAN_PROFILE.USER_UPDATE_ERROR'),
                      'warning'
                    );
                    // Aunque falle la actualización del usuario, el businessman se creó
                    this.businessmanProfile = new Businessman(updatedProfile);
                    this.logoUrl = updatedProfile.logo || '';
                    this.selectedFile = null;
                    this.isEditMode = true;
                    this.isSaving = false;
                  }
                });
              },
              error: (error) => {
                console.error('❌ Error completing businessman profile:', error);
                this.showNotification(
                  this.translate.instant('BUSINESSMAN_PROFILE.PROFILE_ERROR'),
                  'error'
                );
                this.isSaving = false;
              }
            });
          },
          error: (error) => {
            console.error('❌ Error creating businessman profile:', error);
            this.showNotification(
              this.translate.instant('BUSINESSMAN_PROFILE.PROFILE_ERROR'),
              'error'
            );
            this.isSaving = false;
          }
        });
      }
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
