// src/app/configuration/components/businessman-configuration/businessman-configuration.component.ts
// CAMBIOS ESPECÍFICOS PARA CONECTAR CON EL BACKEND REAL

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigurationService } from '../../services/configuration.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { Configuration } from '../../models/configuration.entity';
import { AppButtonComponent } from '../../../core/components/app-button/app-button.component';
import { AppNotificationComponent } from '../../../core/components/app-notification/app-notification.component';
import { ThemeSwitcherComponent } from '../../../core/components/theme-switcher/theme-switcher.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-businessman-configuration',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AppButtonComponent,
    AppNotificationComponent,
    ThemeSwitcherComponent,
    TranslateModule,
    RouterModule
  ],
  templateUrl: './businessman-configuration.component.html',
  styleUrls: ['./businessman-configuration.component.css']
})
export class BusinessmanConfigurationComponent implements OnInit, OnDestroy {
  // Usuario actual
  currentUserId: string = '';

  // Configuración
  configuration: Configuration | null = null;

  // CAMBIO 1: Actualizar opciones según backend
  languageOptions = [
    { label: 'Español', value: 'es' },
    { label: 'English', value: 'en' }
  ];

  // CAMBIO 2: Agregar opciones de suscripción para mostrar
  subscriptionOptions = [
    { label: 'Básico', value: 'basic' },
    { label: 'Corporativo', value: 'corporate' }
  ];

  // ELIMINAR: batchCodeOptions ya no se usa
  // batchCodeOptions = [...]

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
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.id) {
      this.currentUserId = user.id;
      this.loadConfiguration();
    }

    // CAMBIO: Suscribirse a cambios de tema del ThemeService
    this.subscriptions.add(
      this.themeService.theme$.subscribe((newTheme) => {
        if (this.configuration && this.configuration.viewMode !== newTheme) {
          this.configuration.viewMode = newTheme;
          this.savePreferencesQuietly();
        }
      })
    );

    // Cargar idioma guardado
    const savedLanguage = localStorage.getItem('userLanguage');
    if (savedLanguage && this.translateService.getLangs().includes(savedLanguage)) {
      this.translateService.use(savedLanguage);
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
      // CAMBIO 3: Guardar automáticamente al cambiar idioma
      this.savePreferencesOnly();
    }
  }

  // ELIMINAR: updateTranslatedOptions() ya no se necesita
  // updateTranslatedOptions(): void { ... }

  // CAMBIO 4: Actualizar loadConfiguration para usar nuevo servicio
  loadConfiguration(): void {
    this.isLoading = true;

    // Usar el nuevo método directo
    const userId = parseInt(this.currentUserId, 10);

    this.configurationService.getConfigurationByUserId(userId).subscribe({
      next: (config) => {
        this.configuration = config;
        this.applyConfigurationSettings();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar configuración:', error);
        this.showNotification(
          this.translateService.instant('CONFIGURATION.ERROR_LOAD'),
          'error'
        );
        this.isLoading = false;

        // CAMBIO 5: Configuración por defecto sin batchCodeFormat
        this.configuration = new Configuration({
          userId: this.currentUserId,
          userType: 'businessman',
          language: 'es',
          viewMode: 'auto',
          subscriptionPlan: 'basic'
          // ELIMINAR: batchCodeFormat: 'automatic',
          // ELIMINAR: createdAt: new Date().toISOString(),
          // ELIMINAR: subscriptionStartDate: new Date().toISOString()
        });
      }
    });
  }

  // Aplicar configuraciones cargadas
  private applyConfigurationSettings(): void {
    if (!this.configuration) return;

    // Aplicar idioma
    if (this.configuration.language) {
      this.changeLanguageWithoutSave(this.configuration.language);
    }

    // Aplicar tema
    if (this.configuration.viewMode) {
      this.themeService.syncFromConfiguration(this.configuration.viewMode);
    }
  }

  // CAMBIO 6: Método para cambiar idioma sin guardar (evitar loop)
  private changeLanguageWithoutSave(langCode: string): void {
    this.translateService.use(langCode);
    localStorage.setItem('userLanguage', langCode);
  }

  // CAMBIO 7: Actualizar saveConfiguration para usar nuevo backend
  saveConfiguration(): void {
    if (!this.configuration) return;

    this.isLoading = true;

    // Sincronizar el tema actual con la configuración
    this.configuration.viewMode = this.themeService.getThemeForConfiguration();

    if (this.configuration.id) {
      // Usar el nuevo método de actualización múltiple
      const configId = parseInt(this.configuration.id, 10);

      this.configurationService.updateMultiplePreferences(configId, {
        language: this.configuration.language,
        viewMode: this.configuration.viewMode,
        subscriptionPlan: this.configuration.subscriptionPlan
      }).subscribe({
        next: (updatedConfig) => {
          this.configuration = updatedConfig;
          this.showNotification(
            this.translateService.instant('CONFIGURATION.SUCCESS_SAVE'),
            'success'
          );
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al guardar configuración:', error);
          this.showNotification(
            this.translateService.instant('CONFIGURATION.ERROR_SAVE'),
            'error'
          );
          this.isLoading = false;
        }
      });
    } else {
      // CAMBIO 8: Ya no crear configuraciones, solo mostrar error
      console.warn('⚠️ Configuración sin ID - el backend debería crearla automáticamente');
      this.showNotification('Error: Configuración no encontrada', 'error');
      this.isLoading = false;
    }
  }

  // CAMBIO 9: Método para guardar preferencias sin mostrar notificación
  private savePreferencesQuietly(): void {
    if (!this.configuration || this.isLoading || !this.configuration.id) return;

    const configId = parseInt(this.configuration.id, 10);

    this.configurationService.updateUserPreferences(
      configId,
      this.configuration.language,
      this.configuration.viewMode
    ).subscribe({
      next: (updatedConfig) => {
        // Actualizar solo los datos necesarios sin mostrar notificación
        this.configuration!.subscriptionPlan = updatedConfig.subscriptionPlan;
        this.configuration!.updatedAt = updatedConfig.updatedAt;
      },
      error: (error) => {
        console.error('Error al actualizar preferencias:', error);
      }
    });
  }

  // CAMBIO 10: Método para guardar preferencias con notificación
  private savePreferencesOnly(): void {
    if (!this.configuration || this.isLoading) return;

    this.isLoading = true;
    const configId = parseInt(this.configuration.id!, 10);

    this.configurationService.updateUserPreferences(
      configId,
      this.configuration.language,
      this.configuration.viewMode
    ).subscribe({
      next: (updatedConfig) => {
        this.configuration = updatedConfig;
        this.showNotification(
          this.translateService.instant('CONFIGURATION.SUCCESS_SAVE'),
          'success'
        );
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al actualizar preferencias:', error);
        this.showNotification(
          this.translateService.instant('CONFIGURATION.ERROR_SAVE'),
          'error'
        );
        this.isLoading = false;
      }
    });
  }

  // ELIMINAR: onThemeChange() ya no se necesita

  cancel(): void {
    this.loadConfiguration();
  }

  showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.notification = {
      show: true,
      message,
      type
    };

    // Auto-ocultar después de 3 segundos
    setTimeout(() => {
      this.notification.show = false;
    }, 3000);
  }
}
