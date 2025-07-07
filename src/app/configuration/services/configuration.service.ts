// src/app/configuration/services/configuration.service.ts
// VERSIÓN FINAL ARREGLADA - Reemplaza tu archivo completo con este código

import { Injectable } from '@angular/core';
import { Observable, map, catchError, retry, throwError, switchMap } from 'rxjs';

import { Configuration } from '../models/configuration.entity';
import { BaseService } from '../../core/services/base.service';

/**
 * Configuration service for managing user configuration settings
 * Connects to Spring Boot backend Configuration bounded context
 */
@Injectable({
  providedIn: 'root'
})
export class ConfigurationService extends BaseService<Configuration> {

  constructor() {
    super();
    // Configurar el endpoint específico para configuraciones
    this.resourceEndpoint = '/configurations';
  }

  /**
   * Obtiene la configuración de un usuario específico
   * GET /api/v1/configurations?userId={userId}
   */
  public getConfigurationByUserId(userId: number): Observable<Configuration> {
    const url = `${this.resourcePath()}?userId=${userId}`;

    return this.http.get<any>(url, this.httpOptions)
      .pipe(
        map(response => this.transformBackendToFrontend(response)),
        catchError(this.handleError)
      );
  }

  /**
   * Actualiza una configuración existente
   * PUT /api/v1/configurations/{id}
   * ARREGLADO: El backend requiere TODOS los campos (language, viewMode, subscriptionPlan)
   */
  public updateConfiguration(id: number, configuration: Partial<Configuration>): Observable<Configuration> {
    // ARREGLO: Necesitamos enviar TODOS los campos requeridos por UpdateConfigurationCommand
    // El backend espera: language, viewMode, subscriptionPlan (todos obligatorios)

    console.log('🔄 ConfigurationService.updateConfiguration called');
    console.log('📤 ID:', id, '(type:', typeof id, ')');
    console.log('📤 Configuration input:', JSON.stringify(configuration, null, 2));

    // Necesitamos los valores actuales para completar los campos faltantes
    if (!configuration.language || !configuration.viewMode) {
      console.error('❌ FALTAN CAMPOS REQUERIDOS: language y viewMode son obligatorios');
      return throwError(() => new Error('Language y viewMode son requeridos para actualizar configuración'));
    }

    // El backend espera todos los campos
    const requestBody = {
      language: configuration.language,
      viewMode: configuration.viewMode,
      subscriptionPlan: configuration.subscriptionPlan || 'basic'
    };

    console.log('📤 URL:', `${this.resourcePath()}/${id}`);
    console.log('📤 Request Body (COMPLETO):', JSON.stringify(requestBody, null, 2));

    return this.http.put<any>(`${this.resourcePath()}/${id}`, requestBody, this.httpOptions)
      .pipe(
        map(response => {
          console.log('📥 Backend Response:', response);
          return this.transformBackendToFrontend(response);
        }),
        catchError((error) => {
          console.error('❌ UPDATE CONFIGURATION ERROR:');
          console.error('   Status:', error.status);
          console.error('   StatusText:', error.statusText);
          console.error('   Message:', error.message);
          console.error('   URL:', `${this.resourcePath()}/${id}`);
          console.error('   Request Body:', JSON.stringify(requestBody, null, 2));
          console.error('   Full Error:', error);
          return this.handleError(error);
        })
      );
  }

  /**
   * Actualiza solo las preferencias de usuario (idioma y tema)
   */
  public updateUserPreferences(configId: number, language: string, viewMode: string): Observable<Configuration> {
    console.log('🔄 updateUserPreferences:', { configId, language, viewMode });
    return this.updateConfiguration(configId, {
      language: language,
      viewMode: viewMode
    });
  }

  /**
   * Actualiza el plan de suscripción con configuración completa
   * ARREGLADO: Obtiene configuración actual y actualiza con todos los campos
   */
  public updateSubscriptionPlanComplete(configId: number, userId: number, subscriptionPlan: string): Observable<Configuration> {
    console.log('🔄 updateSubscriptionPlanComplete called with:');
    console.log('   configId:', configId);
    console.log('   userId:', userId);
    console.log('   subscriptionPlan:', subscriptionPlan);

    // Primero obtener la configuración actual
    return this.getConfigurationByUserId(userId).pipe(
      switchMap(currentConfig => {
        console.log('📋 Configuración actual obtenida:', currentConfig);

        // Ahora actualizar con todos los campos requeridos
        return this.updateConfiguration(configId, {
          language: currentConfig.language,           // Mantener valor actual
          viewMode: currentConfig.viewMode,           // Mantener valor actual
          subscriptionPlan: subscriptionPlan          // Nuevo valor
        });
      }),
      catchError((error) => {
        console.error('❌ Error obteniendo configuración actual:', error);
        // Intentar con valores por defecto
        console.log('🔄 Intentando con valores por defecto...');
        return this.updateConfiguration(configId, {
          language: 'es',                             // Valor por defecto
          viewMode: 'auto',                           // Valor por defecto
          subscriptionPlan: subscriptionPlan          // Nuevo valor
        });
      })
    );
  }

  /**
   * Actualiza el plan de suscripción (método simplificado para compatibilidad)
   */
  public updateSubscriptionPlan(configId: number, subscriptionPlan: string): Observable<Configuration> {
    console.log('🔄 updateSubscriptionPlan - usando valores por defecto');

    // Usar valores por defecto ya que no tenemos el userId aquí
    return this.updateConfiguration(configId, {
      language: 'es',                             // Valor por defecto
      viewMode: 'auto',                           // Valor por defecto
      subscriptionPlan: subscriptionPlan          // Nuevo valor
    });
  }

  /**
   * Transforma datos del backend al formato del frontend
   */
  private transformBackendToFrontend(backendData: any): Configuration {
    return new Configuration({
      id: backendData.id?.toString(),
      userId: backendData.userId?.toString(),
      userType: 'businessman', // Por defecto, puede ser ajustado según lógica de negocio
      language: backendData.language || 'es',
      viewMode: backendData.viewMode || 'auto',
      subscriptionPlan: backendData.subscriptionPlan || 'basic',
      subscriptionStatus: backendData.subscriptionStatus || 'pending',  // *** NUEVO CAMPO ***
      subscriptionStartDate: backendData.subscriptionStartDate,
      createdAt: backendData.createdAt,
      updatedAt: backendData.updatedAt
    });
  }

  /**
   * Actualiza múltiples preferencias en una sola llamada
   */
  public updateMultiplePreferences(
    configId: number,
    preferences: {
      language?: string;
      viewMode?: string;
      subscriptionPlan?: string;
    }
  ): Observable<Configuration> {
    console.log('🔄 updateMultiplePreferences:', { configId, preferences });
    return this.updateConfiguration(configId, preferences);
  }

  /**
   * Verifica si la configuración existe para un usuario
   */
  public hasConfiguration(userId: number): Observable<boolean> {
    return this.getConfigurationByUserId(userId)
      .pipe(
        map(() => true),
        catchError(() => [false])
      );
  }

  /**
   * Método utilitario para obtener configuración con manejo de errores mejorado
   */
  public getConfigurationSafe(userId: number): Observable<Configuration | null> {
    return this.getConfigurationByUserId(userId)
      .pipe(
        catchError((error) => {
          console.error('Error al obtener configuración:', error);
          return [null];
        })
      );
  }

  // ==================== MÉTODOS PARA COMPATIBILIDAD CON COMPONENTES EXISTENTES ====================

  /**
   * Alias para getConfigurationByUserId - compatibilidad con componentes
   */
  public getByUserId(userId: string): Observable<Configuration> {
    const userIdNumber = parseInt(userId, 10);
    return this.getConfigurationByUserId(userIdNumber);
  }

  /**
   * Método create - NO DEBE USARSE (backend crea automáticamente)
   */
  public override create(configuration: Configuration): Observable<Configuration> {
    console.warn('⚠️ CREATE no debe usarse - el backend crea configuraciones automáticamente');
    return throwError(() => new Error('Las configuraciones se crean automáticamente en el backend'));
  }

  /**
   * Método update - wrapper para updateConfiguration
   */
  public override update(id: string, configuration: Configuration): Observable<Configuration> {
    const configId = parseInt(id, 10);
    return this.updateConfiguration(configId, configuration);
  }
  // ==================== MÉTODOS PARA SUBSCRIPTION STATUS ====================

  /**
   * Verifica si el usuario requiere pago (subscription status = pending)
   */
  public requiresPayment(userId: number): Observable<boolean> {
    return this.getConfigurationByUserId(userId).pipe(
      map(config => {
        if (!config) return true; // Si no hay config, necesita pagar
        return config.subscriptionStatus === 'pending';
      }),
      catchError(() => {
        // En caso de error, asumir que necesita pago por seguridad
        return [true];
      })
    );
  }

  /**
   * Activa la suscripción después de un pago exitoso
   * Actualiza tanto el plan como el status a 'active'
   */
  /**
   * MÉTODO CORREGIDO: Activa la suscripción después de un pago exitoso
   * Actualiza tanto el plan como el status a 'active'
   */
  public activateSubscription(configId: number, subscriptionPlan: string): Observable<Configuration> {
    console.log('🔄 Activating subscription:', { configId, subscriptionPlan });

    // Primero obtener la configuración actual usando el configId como userId
    // En tu sistema, parece que configId y userId son el mismo valor
    return this.getConfigurationByUserId(configId).pipe(
      switchMap(currentConfig => {
        if (!currentConfig) {
          return throwError(() => new Error('Configuration not found for user ID: ' + configId));
        }

        console.log('📋 Configuración actual antes de activar:', currentConfig);

        // Preparar body con todos los campos requeridos + status active
        const requestBody = {
          language: currentConfig.language || 'es',          // Mantener actual o default
          viewMode: currentConfig.viewMode || 'auto',        // Mantener actual o default
          subscriptionPlan: subscriptionPlan,                // Nuevo plan
          subscriptionStatus: 'active'                       // *** ACTIVAR SUSCRIPCIÓN ***
        };

        console.log('📤 Activating subscription with body:', requestBody);
        console.log('📤 URL:', `${this.resourcePath()}/${currentConfig.id}`);

        return this.http.put<any>(`${this.resourcePath()}/${currentConfig.id}`, requestBody, this.httpOptions);
      }),
      map(response => {
        console.log('✅ Subscription activated successfully:', response);
        console.log('   Final subscriptionPlan:', response.subscriptionPlan);
        console.log('   Final subscriptionStatus:', response.subscriptionStatus);
        return this.transformBackendToFrontend(response);
      }),
      catchError((error) => {
        console.error('❌ Error activating subscription:');
        console.error('   Status:', error.status);
        console.error('   Message:', error.message);
        console.error('   Error:', error);
        return this.handleError(error);
      })
    );
  }

  /**
   * Obtiene el status de suscripción de un usuario
   */
  public getSubscriptionStatus(userId: number): Observable<string> {
    return this.getConfigurationByUserId(userId).pipe(
      map(config => config?.subscriptionStatus || 'pending'),
      catchError(() => ['pending']) // Default a pending en caso de error
    );
  }

  /**
   * Verifica si el usuario tiene suscripción activa
   */
  public hasActiveSubscription(userId: number): Observable<boolean> {
    return this.getConfigurationByUserId(userId).pipe(
      map(config => {
        if (!config) return false;
        return config.subscriptionStatus === 'active';
      }),
      catchError(() => [false])
    );
  }






}
