// supplier-profile-configuration.component.ts - FINAL VERSION SIGUIENDO BUSINESSMAN EXACTAMENTE

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
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
  styleUrl: './supplier-profile-configuration.component.css'
})
export class SupplierProfileConfigurationComponent implements OnInit, OnDestroy {
  form!: FormGroup;

  // Estados del componente
  isLoading: boolean = false;
  isSaving: boolean = false;
  isEditMode: boolean = false;

  // Datos del usuario y supplier
  currentUser: any = null;
  supplierProfile: Supplier = new Supplier({});

  // Imagen/Logo
  selectedFile: File | null = null;
  previewUrl: string = '';
  logoUrl: string = '';

  // Listas para selects (compatible con app-input)
  specializationOptions: Array<{label: string, value: any}> = [];
  categoryOptions: Array<{label: string, value: any}> = [];

  // API de países y ciudades
  countries: Array<{label: string, value: string}> = [];
  cities: Array<{label: string, value: string}> = [];
  loadingCities = false;

  // Categorías seleccionadas
  selectedCategories: string[] = [];

  // Notificación
  notification = {
    show: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'warning' | 'info'
  };

  private destroy$ = new Subject<void>();

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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
   * Inicializa el formulario reactivo - IGUAL QUE BUSINESSMAN
   */
  initForm() {
    this.form = this.fb.group({
      // Datos de la empresa
      companyName: ['', Validators.required],
      ruc: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      specialization: ['', Validators.required],
      yearsFounded: [new Date().getFullYear()],
      warehouseLocation: ['', Validators.required],
      minimumOrderQuantity: [1, [Validators.required, Validators.min(1)]],

      // Datos personales - EDITABLES
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
    // Especializaciones con traducción directa
    this.specializationOptions = [
      { value: 'cotton', label: this.translate.instant('SUPPLIER_PROFILE.SPECIALIZATIONS.COTTON') },
      { value: 'polyester', label: this.translate.instant('SUPPLIER_PROFILE.SPECIALIZATIONS.POLYESTER') },
      { value: 'wool', label: this.translate.instant('SUPPLIER_PROFILE.SPECIALIZATIONS.WOOL') },
      { value: 'silk', label: this.translate.instant('SUPPLIER_PROFILE.SPECIALIZATIONS.SILK') },
      { value: 'linen', label: this.translate.instant('SUPPLIER_PROFILE.SPECIALIZATIONS.LINEN') },
      { value: 'blends', label: this.translate.instant('SUPPLIER_PROFILE.SPECIALIZATIONS.BLENDS') },
      { value: 'technical', label: this.translate.instant('SUPPLIER_PROFILE.SPECIALIZATIONS.TECHNICAL') },
      { value: 'sustainable', label: this.translate.instant('SUPPLIER_PROFILE.SPECIALIZATIONS.SUSTAINABLE') }
    ];

    // Categorías de productos
    this.categoryOptions = [
      { value: 'basic_fabrics', label: this.translate.instant('SUPPLIER_PROFILE.CATEGORIES.BASIC_FABRICS') },
      { value: 'premium_fabrics', label: this.translate.instant('SUPPLIER_PROFILE.CATEGORIES.PREMIUM_FABRICS') },
      { value: 'sports_fabrics', label: this.translate.instant('SUPPLIER_PROFILE.CATEGORIES.SPORTS_FABRICS') },
      { value: 'home_fabrics', label: this.translate.instant('SUPPLIER_PROFILE.CATEGORIES.HOME_FABRICS') },
      { value: 'industrial_fabrics', label: this.translate.instant('SUPPLIER_PROFILE.CATEGORIES.INDUSTRIAL_FABRICS') },
      { value: 'textile_accessories', label: this.translate.instant('SUPPLIER_PROFILE.CATEGORIES.TEXTILE_ACCESSORIES') },
      { value: 'threads_fibers', label: this.translate.instant('SUPPLIER_PROFILE.CATEGORIES.THREADS_FIBERS') },
      { value: 'printed_fabrics', label: this.translate.instant('SUPPLIER_PROFILE.CATEGORIES.PRINTED_FABRICS') }
    ];

    // Escuchar cambios de idioma
    this.translate.onLangChange
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadTranslatedLists();
      });
  }

  /**
   * Carga los datos del usuario actual - IGUAL QUE BUSINESSMAN
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

    // Cargar perfil de supplier si existe
    this.loadSupplierProfile();
  }

  /**
   * Carga el perfil de supplier - EXACTAMENTE IGUAL QUE BUSINESSMAN
   */
  loadSupplierProfile() {
    this.supplierService.getProfileById(this.currentUser.id).subscribe({
      next: (profile) => {
        if (profile) {
          this.supplierProfile = new Supplier(profile);
          this.logoUrl = profile.logo || '';
          this.previewUrl = this.logoUrl;
          this.selectedCategories = profile.productCategories || [];
          this.isEditMode = true;

          // Cargar datos del perfil al formulario
          this.form.patchValue({
            // Datos de la empresa
            companyName: profile.companyName || '',
            ruc: profile.ruc || '',
            specialization: profile.specialization || '',
            yearsFounded: profile.yearsFounded || new Date().getFullYear(),
            warehouseLocation: profile.warehouseLocation || '',
            minimumOrderQuantity: profile.minimumOrderQuantity || 1,

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
          this.supplierProfile = new Supplier({
            id: this.currentUser.id,
            name: this.currentUser.name,
            email: this.currentUser.email,
            role: 'supplier',
            country: this.currentUser.country,
            city: this.currentUser.city,
            address: this.currentUser.address,
            phone: this.currentUser.phone,
            yearsFounded: new Date().getFullYear()
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
        this.supplierProfile = new Supplier({
          id: this.currentUser.id,
          name: this.currentUser.name,
          email: this.currentUser.email,
          role: 'supplier',
          country: this.currentUser.country,
          city: this.currentUser.city,
          address: this.currentUser.address,
          phone: this.currentUser.phone,
          yearsFounded: new Date().getFullYear()
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
   * Maneja la selección de archivo - IGUAL QUE BUSINESSMAN
   */
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) {
      return; // Si no hay archivo, no hacer nada
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      this.showNotification(
        this.translate.instant('SUPPLIER_PROFILE.INVALID_IMAGE_TYPE'),
        'warning'
      );
      // Limpiar el input
      event.target.value = '';
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.showNotification(
        this.translate.instant('SUPPLIER_PROFILE.IMAGE_TOO_LARGE'),
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
    this.supplierProfile.logo = '';
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
   * Maneja el toggle de categorías
   */
  toggleCategory(categoryKey: string): void {
    const index = this.selectedCategories.indexOf(categoryKey);

    if (index > -1) {
      // Remover categoría
      this.selectedCategories.splice(index, 1);
    } else {
      // Agregar categoría (máximo 5)
      if (this.selectedCategories.length < 5) {
        this.selectedCategories.push(categoryKey);
      } else {
        this.showNotification(
          this.translate.instant('SUPPLIER_PROFILE.MAX_CATEGORIES'),
          'warning'
        );
        return;
      }
    }
  }

  /**
   * Verifica si una categoría está seleccionada
   */
  isCategorySelected(categoryKey: string): boolean {
    return this.selectedCategories.includes(categoryKey);
  }

  /**
   * Obtiene el label traducido de una especialización por su value
   */
  getSpecializationLabel(value: string): string {
    const option = this.specializationOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  }

  /**
   * Obtiene el label traducido de una categoría por su value
   */
  getCategoryLabel(value: string): string {
    const option = this.categoryOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  }

  /**
   * Valida el formulario - IGUAL QUE BUSINESSMAN
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

    if (this.selectedCategories.length === 0) {
      this.showNotification(
        this.translate.instant('SUPPLIER_PROFILE.CATEGORIES_REQUIRED'),
        'warning'
      );
      return false;
    }

    // Validar RUC (formato básico para Perú)
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
   * Guarda el perfil - EXACTAMENTE IGUAL QUE BUSINESSMAN PARA ACTUALIZAR AMBAS TABLAS
   */
  async saveProfile() {
    if (!this.form.valid || !this.validateForm() || this.isSaving) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;

    try {
      const formValues = this.form.getRawValue();

      // Actualizar el objeto supplier con los valores del formulario
      this.supplierProfile.companyName = formValues.companyName;
      this.supplierProfile.ruc = formValues.ruc;
      this.supplierProfile.specialization = formValues.specialization;
      this.supplierProfile.productCategories = [...this.selectedCategories];
      this.supplierProfile.yearsFounded = formValues.yearsFounded;
      this.supplierProfile.warehouseLocation = formValues.warehouseLocation;
      this.supplierProfile.minimumOrderQuantity = formValues.minimumOrderQuantity;

      // Actualizar datos personales EN EL SUPPLIER
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

      if (this.isEditMode) {
        // ===== ACTUALIZAR PERFIL EXISTENTE =====

        // 1. Actualizar tabla supplier
        this.supplierService.updateProfile(this.supplierProfile.id!, this.supplierProfile).subscribe({
          next: (updatedProfile) => {
            console.log('✅ Supplier profile updated:', updatedProfile);

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
                  this.translate.instant('SUPPLIER_PROFILE.PROFILE_UPDATED_SUCCESS'),
                  'success'
                );
                this.supplierProfile = new Supplier(updatedProfile);
                this.logoUrl = updatedProfile.logo || '';
                this.selectedFile = null;
                this.isSaving = false;
              },
              error: (userError) => {
                console.error('❌ Error updating user data:', userError);
                this.showNotification(
                  this.translate.instant('SUPPLIER_PROFILE.USER_UPDATE_ERROR'),
                  'warning'
                );
                // Aunque falle la actualización del usuario, el supplier se actualizó
                this.supplierProfile = new Supplier(updatedProfile);
                this.logoUrl = updatedProfile.logo || '';
                this.selectedFile = null;
                this.isSaving = false;
              }
            });
          },
          error: (error) => {
            console.error('❌ Error updating supplier profile:', error);
            this.showNotification(
              this.translate.instant('SUPPLIER_PROFILE.PROFILE_ERROR'),
              'error'
            );
            this.isSaving = false;
          }
        });

      } else {
        // ===== CREAR NUEVO PERFIL =====

        this.supplierService.createProfile(this.currentUser.id).subscribe({
          next: (newProfile) => {
            const completeProfile = new Supplier({
              ...newProfile,
              ...this.supplierProfile
            });

            // 1. Completar perfil supplier
            this.supplierService.updateProfile(newProfile.id!, completeProfile).subscribe({
              next: (updatedProfile) => {
                console.log('✅ New supplier profile created:', updatedProfile);

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
                      this.translate.instant('SUPPLIER_PROFILE.PROFILE_CREATED_SUCCESS'),
                      'success'
                    );
                    this.supplierProfile = new Supplier(updatedProfile);
                    this.logoUrl = updatedProfile.logo || '';
                    this.selectedFile = null;
                    this.isEditMode = true;
                    this.isSaving = false;
                  },
                  error: (userError) => {
                    console.error('❌ Error updating user data:', userError);
                    this.showNotification(
                      this.translate.instant('SUPPLIER_PROFILE.USER_UPDATE_ERROR'),
                      'warning'
                    );
                    // Aunque falle la actualización del usuario, el supplier se creó
                    this.supplierProfile = new Supplier(updatedProfile);
                    this.logoUrl = updatedProfile.logo || '';
                    this.selectedFile = null;
                    this.isEditMode = true;
                    this.isSaving = false;
                  }
                });
              },
              error: (error) => {
                console.error('❌ Error completing supplier profile:', error);
                this.showNotification(
                  this.translate.instant('SUPPLIER_PROFILE.PROFILE_ERROR'),
                  'error'
                );
                this.isSaving = false;
              }
            });
          },
          error: (error) => {
            console.error('❌ Error creating supplier profile:', error);
            this.showNotification(
              this.translate.instant('SUPPLIER_PROFILE.PROFILE_ERROR'),
              'error'
            );
            this.isSaving = false;
          }
        });
      }
    } catch (error) {
      console.error('❌ Error processing profile:', error);
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

  // Getters para validación del formulario
  get fullName() { return this.form.get('fullName'); }
  get email() { return this.form.get('email'); }
  get country() { return this.form.get('country'); }
  get city() { return this.form.get('city'); }
  get address() { return this.form.get('address'); }
  get phone() { return this.form.get('phone'); }
  get companyName() { return this.form.get('companyName'); }
  get ruc() { return this.form.get('ruc'); }
  get specialization() { return this.form.get('specialization'); }
  get yearsFounded() { return this.form.get('yearsFounded'); }
  get warehouseLocation() { return this.form.get('warehouseLocation'); }
  get minimumOrderQuantity() { return this.form.get('minimumOrderQuantity'); }
}
