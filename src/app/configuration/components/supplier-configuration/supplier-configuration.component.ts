// src/app/configuration/components/supplier-configuration/supplier-configuration.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigurationService } from '../../services/configuration.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Configuration } from '../../models/configuration.entity';
import { AppInputComponent } from '../../../core/components/app-input/app-input.component';
import { AppButtonComponent } from '../../../core/components/app-button/app-button.component';
import { AppNotificationComponent } from '../../../core/components/app-notification/app-notification.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-supplier-configuration',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AppInputComponent,
    AppButtonComponent,
    AppNotificationComponent,
    TranslateModule
  ],
  templateUrl: './supplier-configuration.component.html',
  styleUrls: ['./supplier-configuration.component.css']
})
export class SupplierConfigurationComponent implements OnInit {
  // Usuario actual
  currentUserId: number = 0;

  // Configuración
  configuration: Configuration | null = null;

  // Opciones para los selectores según el formato requerido por app-input
  languageOptions = [
    { label: 'Español', value: 'es' },
    { label: 'English', value: 'en' }
  ];

  batchCodeOptions = [
    { label: 'Automático', value: 'automatic' },
    { label: 'Manual', value: 'manual' }
  ];

  viewModeOptions = [
    { label: 'Modo claro', value: 'light' },
    { label: 'Modo oscuro', value: 'dark' }
  ];

  // Estado de carga
  isLoading: boolean = false;

  // Notificaciones
  notification = {
    show: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'warning' | 'info'
  };

  constructor(
    private configurationService: ConfigurationService,
    private authService: AuthService,
    private translateService: TranslateService
  ) {
    // Definir idiomas disponibles
    this.translateService.addLangs(['es', 'en']);
    // Idioma por defecto
    this.translateService.setDefaultLang('es');

    // AÑADIR: cargar activamente el idioma por defecto
    this.translateService.use('es');

    // AÑADIR: suscribirse a cambios de traducción para depuración
    this.translateService.get(['CONFIGURATION.AUTOMATIC', 'CONFIGURATION.MANUAL']).subscribe(
      (translations) => {
        console.log('Traducciones cargadas:', translations);
      },
      (error) => {
        console.error('Error al cargar traducciones:', error);
      }
    );
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.id) {
      this.currentUserId = user.id;
      this.loadConfiguration();
    }

    // Cargar idioma guardado en localStorage
    const savedLanguage = localStorage.getItem('userLanguage');
    if (savedLanguage && this.translateService.getLangs().includes(savedLanguage)) {
      this.translateService.use(savedLanguage);
      // Actualizar opciones con traducciones
      this.updateTranslatedOptions();
    }
  }

  // Método para cambiar el idioma
  changeLanguage(langCode: string): void {
    this.translateService.use(langCode);
    localStorage.setItem('userLanguage', langCode);

    // Si tenemos configuración, actualizar
    if (this.configuration) {
      this.configuration.language = langCode;
    }

    // Actualizar opciones con traducciones
    this.updateTranslatedOptions();
  }

  // Actualizar opciones con traducciones
  updateTranslatedOptions(): void {
    console.log('Actualizando opciones traducidas...');

    // MODIFICAR: agregar comprobaciones de fallos
    const automatic = this.translateService.instant('CONFIGURATION.AUTOMATIC');
    const manual = this.translateService.instant('CONFIGURATION.MANUAL');
    const lightMode = this.translateService.instant('CONFIGURATION.LIGHT_MODE');
    const darkMode = this.translateService.instant('CONFIGURATION.DARK_MODE');

    console.log('Traducciones obtenidas:', { automatic, manual, lightMode, darkMode });

    // Comprobar si las traducciones funcionaron o devolvieron las claves sin traducir
    this.batchCodeOptions = [
      { label: automatic !== 'CONFIGURATION.AUTOMATIC' ? automatic : 'Automático', value: 'automatic' },
      { label: manual !== 'CONFIGURATION.MANUAL' ? manual : 'Manual', value: 'manual' }
    ];

    this.viewModeOptions = [
      { label: lightMode !== 'CONFIGURATION.LIGHT_MODE' ? lightMode : 'Modo claro', value: 'light' },
      { label: darkMode !== 'CONFIGURATION.DARK_MODE' ? darkMode : 'Modo oscuro', value: 'dark' }
    ];
  }

  loadConfiguration(): void {
    this.isLoading = true;

    this.configurationService.getByUserId(this.currentUserId).subscribe({
      next: (configs) => {
        if (Array.isArray(configs) && configs.length > 0) {
          this.configuration = configs[0];
          // Aplicar idioma de la configuración
          if (this.configuration && this.configuration.language) {
            this.changeLanguage(this.configuration.language);
          }
        } else if (!Array.isArray(configs)) {
          this.configuration = configs;
          // Aplicar idioma de la configuración
          if (this.configuration && this.configuration.language) {
            this.changeLanguage(this.configuration.language);
          }
        } else {
          // Crear configuración por defecto si no existe
          this.configuration = new Configuration({
            userId: this.currentUserId,
            userType: 'supplier',
            language: 'es', // Cambiado a código de idioma
            batchCodeFormat: 'automatic',
            viewMode: 'light',
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

        // Crear configuración por defecto en caso de error
        this.configuration = new Configuration({
          userId: this.currentUserId,
          userType: 'supplier',
          language: 'es', // Cambiado a código de idioma
          batchCodeFormat: 'automatic',
          viewMode: 'light',
          createdAt: new Date().toISOString()
        });
      }
    });
  }

  saveConfiguration(): void {
    if (!this.configuration) return;

    this.isLoading = true;

    // Actualizar fecha
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
    // Recargar la configuración original
    this.loadConfiguration();
  }

  // Método auxiliar para mostrar notificaciones
  showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.notification = {
      show: true,
      message,
      type
    };
  }
}
