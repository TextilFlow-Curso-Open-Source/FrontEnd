// src/app/configuration/components/businessman-configuration/businessman-configuration.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigurationService } from '../../services/configuration.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { Configuration } from '../../models/configuration.entity';
import { AppInputComponent } from '../../../core/components/app-input/app-input.component';
import { AppButtonComponent } from '../../../core/components/app-button/app-button.component';
import { AppNotificationComponent } from '../../../core/components/app-notification/app-notification.component';
import { ThemeSwitcherComponent } from '../../../core/components/theme-switcher/theme-switcher.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-businessman-configuration',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AppInputComponent,
    AppButtonComponent,
    AppNotificationComponent,
    ThemeSwitcherComponent,
    TranslateModule
  ],
  templateUrl: './businessman-configuration.component.html',
  styleUrls: ['./businessman-configuration.component.css']
})
export class BusinessmanConfigurationComponent implements OnInit, OnDestroy {
  // Usuario actual
  currentUserId: string = '';

  // Configuración
  configuration: Configuration | null = null;

  // Opciones para los selectores
  languageOptions = [
    { label: 'Español', value: 'es' },
    { label: 'English', value: 'en' }
  ];

  batchCodeOptions = [
    { label: 'Automático', value: 'automatic' },
    { label: 'Manual', value: 'manual' }
  ];

  // Estado de carga
  isLoading: boolean = false;

  // Notificaciones
  notification = {
    show: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'warning' | 'info'
  };

  private subscriptions = new Subscription();

  constructor(
    private configurationService: ConfigurationService,
    private authService: AuthService,
    private themeService: ThemeService,
    private translateService: TranslateService
  ) {
    // Configurar idiomas
    this.translateService.addLangs(['es', 'en']);
    this.translateService.setDefaultLang('es');
    this.translateService.use('es');

    // Suscribirse a traducciones
    this.subscriptions.add(
      this.translateService.get(['CONFIGURATION.AUTOMATIC', 'CONFIGURATION.MANUAL']).subscribe(
        (translations) => {
          console.log('Traducciones cargadas:', translations);
        },
        (error) => {
          console.error('Error al cargar traducciones:', error);
        }
      )
    );
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.id) {
      this.currentUserId = user.id;
      this.loadConfiguration();
    }

    // Cargar idioma guardado
    const savedLanguage = localStorage.getItem('userLanguage');
    if (savedLanguage && this.translateService.getLangs().includes(savedLanguage)) {
      this.translateService.use(savedLanguage);
      this.updateTranslatedOptions();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Método para cambiar el idioma
  changeLanguage(langCode: string): void {
    this.translateService.use(langCode);
    localStorage.setItem('userLanguage', langCode);

    if (this.configuration) {
      this.configuration.language = langCode;
    }

    this.updateTranslatedOptions();
  }

  // Actualizar opciones con traducciones
  updateTranslatedOptions(): void {
    const automatic = this.translateService.instant('CONFIGURATION.AUTOMATIC');
    const manual = this.translateService.instant('CONFIGURATION.MANUAL');

    this.batchCodeOptions = [
      { label: automatic !== 'CONFIGURATION.AUTOMATIC' ? automatic : 'Automático', value: 'automatic' },
      { label: manual !== 'CONFIGURATION.MANUAL' ? manual : 'Manual', value: 'manual' }
    ];
  }

  loadConfiguration(): void {
    this.isLoading = true;

    this.configurationService.getByUserId(this.currentUserId).subscribe({
      next: (configs) => {
        if (Array.isArray(configs) && configs.length > 0) {
          this.configuration = configs[0];
          this.applyConfigurationSettings();
        } else if (!Array.isArray(configs)) {
          this.configuration = configs;
          this.applyConfigurationSettings();
        } else {
          // Crear configuración por defecto
          this.configuration = new Configuration({
            userId: this.currentUserId,
            userType: 'businessman',
            language: 'es',
            batchCodeFormat: 'automatic',
            viewMode: 'auto', // Cambiado a 'auto' por defecto
            createdAt: new Date().toISOString()
          });
          this.saveConfiguration();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar configuración:', error);
        this.showNotification(this.translateService.instant('CONFIGURATION.ERROR_LOAD'), 'error');
        this.isLoading = false;

        // Configuración por defecto en caso de error
        this.configuration = new Configuration({
          userId: this.currentUserId,
          userType: 'businessman',
          language: 'es',
          batchCodeFormat: 'automatic',
          viewMode: 'auto',
          createdAt: new Date().toISOString()
        });
      }
    });
  }

  // Aplicar configuraciones cargadas
  private applyConfigurationSettings(): void {
    if (!this.configuration) return;

    // Aplicar idioma
    if (this.configuration.language) {
      this.changeLanguage(this.configuration.language);
    }

    // Aplicar tema
    if (this.configuration.viewMode) {
      this.themeService.syncFromConfiguration(this.configuration.viewMode);
    }
  }

  saveConfiguration(): void {
    if (!this.configuration) return;

    this.isLoading = true;

    // Sincronizar el tema actual con la configuración
    this.configuration.viewMode = this.themeService.getThemeForConfiguration();
    this.configuration.updatedAt = new Date().toISOString();

    if (this.configuration.id) {
      // Actualizar configuración existente
      this.configurationService.update(this.configuration.id, this.configuration).subscribe({
        next: () => {
          this.showNotification(this.translateService.instant('CONFIGURATION.SUCCESS_SAVE'), 'success');
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al guardar configuración:', error);
          this.showNotification(this.translateService.instant('CONFIGURATION.ERROR_SAVE'), 'error');
          this.isLoading = false;
        }
      });
    } else {
      // Crear nueva configuración
      this.configurationService.create(this.configuration).subscribe({
        next: (config) => {
          this.configuration = config;
          this.showNotification(this.translateService.instant('CONFIGURATION.SUCCESS_SAVE'), 'success');
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al crear configuración:', error);
          this.showNotification(this.translateService.instant('CONFIGURATION.ERROR_SAVE'), 'error');
          this.isLoading = false;
        }
      });
    }
  }

  cancel(): void {
    this.loadConfiguration();
  }

  showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.notification = {
      show: true,
      message,
      type
    };
  }
}
