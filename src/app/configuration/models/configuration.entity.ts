// src/app/configuration/models/configuration.entity.ts

/**
 * Configuration entity matching backend structure
 * Represents user configuration settings and subscription info
 */
export class Configuration {
  id?: string;
  userId: string;
  userType: 'businessman' | 'supplier'; // Frontend specific, not sent to backend
  language: string; // Backend: 'es' | 'en' (desde enums ES, EN)
  viewMode: string; // Backend: 'light' | 'dark' | 'auto' (desde enums LIGHT, DARK, AUTO)
  subscriptionPlan?: string; // Backend: 'basic' | 'corporate' (desde enums BASIC, CORPORATE)
  subscriptionStatus?: string; // *** NUEVO: Backend: 'pending' | 'active' | 'expired' ***
  subscriptionStartDate?: string; // ISO date string
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string

  constructor(data: {
    id?: string;
    userId: string;
    userType: 'businessman' | 'supplier';
    language: string;
    viewMode: string;
    subscriptionPlan?: string;
    subscriptionStatus?: string; // *** NUEVO CAMPO ***
    subscriptionStartDate?: string;
    createdAt?: string;
    updatedAt?: string;
    batchCodeFormat?: string; // DEPRECATED - mantener solo para compatibilidad con componentes existentes
  }) {
    this.id = data.id;
    this.userId = data.userId;
    this.userType = data.userType;
    this.language = data.language;
    this.viewMode = data.viewMode;
    this.subscriptionPlan = data.subscriptionPlan;
    this.subscriptionStatus = data.subscriptionStatus; // *** NUEVO CAMPO ***
    this.subscriptionStartDate = data.subscriptionStartDate;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**
   * Verifica si la suscripción es corporativa
   */
  public isCorporateSubscription(): boolean {
    return this.subscriptionPlan === 'corporate';
  }

  /**
   * Verifica si la suscripción es básica
   */
  public isBasicSubscription(): boolean {
    return this.subscriptionPlan === 'basic' || !this.subscriptionPlan;
  }

  /**
   * *** NUEVO: Verifica si la suscripción está activa ***
   */
  public isSubscriptionActive(): boolean {
    return this.subscriptionStatus === 'active';
  }

  /**
   * *** NUEVO: Verifica si la suscripción está pendiente de pago ***
   */
  public isSubscriptionPending(): boolean {
    return this.subscriptionStatus === 'pending' || !this.subscriptionStatus;
  }

  /**
   * *** NUEVO: Verifica si la suscripción está expirada ***
   */
  public isSubscriptionExpired(): boolean {
    return this.subscriptionStatus === 'expired';
  }

  /**
   * *** NUEVO: Verifica si requiere pago (pending o expired) ***
   */
  public requiresPayment(): boolean {
    return this.isSubscriptionPending() || this.isSubscriptionExpired();
  }

  /**
   * Obtiene el idioma en formato display
   */
  public getDisplayLanguage(): string {
    switch (this.language) {
      case 'es':
        return 'Español';
      case 'en':
        return 'English';
      default:
        return this.language;
    }
  }

  /**
   * Obtiene el modo de vista en formato display
   */
  public getDisplayViewMode(): string {
    switch (this.viewMode) {
      case 'light':
        return 'Claro';
      case 'dark':
        return 'Oscuro';
      case 'auto':
        return 'Automático';
      default:
        return this.viewMode;
    }
  }

  /**
   * Obtiene el plan de suscripción en formato display
   */
  public getDisplaySubscriptionPlan(): string {
    switch (this.subscriptionPlan) {
      case 'basic':
        return 'Básico';
      case 'corporate':
        return 'Corporativo';
      default:
        return 'Básico';
    }
  }

  /**
   * *** NUEVO: Obtiene el status de suscripción en formato display ***
   */
  public getDisplaySubscriptionStatus(): string {
    switch (this.subscriptionStatus) {
      case 'active':
        return 'Activa';
      case 'pending':
        return 'Pendiente de Pago';
      case 'expired':
        return 'Expirada';
      default:
        return 'Pendiente de Pago';
    }
  }

  /**
   * Verifica si los valores son válidos según los enums del backend
   */
  public isValid(): boolean {
    const validLanguages = ['es', 'en'];
    const validViewModes = ['light', 'dark', 'auto'];
    const validSubscriptionPlans = ['basic', 'corporate'];
    const validSubscriptionStatuses = ['pending', 'active', 'expired']; // *** NUEVO ***

    return validLanguages.includes(this.language) &&
      validViewModes.includes(this.viewMode) &&
      (this.subscriptionPlan ? validSubscriptionPlans.includes(this.subscriptionPlan) : true) &&
      (this.subscriptionStatus ? validSubscriptionStatuses.includes(this.subscriptionStatus) : true); // *** NUEVO ***
  }

  /**
   * Obtiene las opciones disponibles para idiomas
   */
  public static getLanguageOptions() {
    return [
      { value: 'es', label: 'Español' },
      { value: 'en', label: 'English' }
    ];
  }

  /**
   * Obtiene las opciones disponibles para modos de vista
   */
  public static getViewModeOptions() {
    return [
      { value: 'light', label: 'Claro' },
      { value: 'dark', label: 'Oscuro' },
      { value: 'auto', label: 'Automático' }
    ];
  }

  /**
   * Obtiene las opciones disponibles para planes de suscripción
   */
  public static getSubscriptionPlanOptions() {
    return [
      { value: 'basic', label: 'Básico' },
      { value: 'corporate', label: 'Corporativo' }
    ];
  }

  /**
   * *** NUEVO: Obtiene las opciones disponibles para status de suscripción ***
   */
  public static getSubscriptionStatusOptions() {
    return [
      { value: 'pending', label: 'Pendiente de Pago' },
      { value: 'active', label: 'Activa' },
      { value: 'expired', label: 'Expirada' }
    ];
  }

  /**
   * Crea una instancia desde datos del backend
   * El backend devuelve los valores de los enums ya procesados
   */
  public static fromBackendData(backendData: any, userType: 'businessman' | 'supplier' = 'businessman'): Configuration {
    return new Configuration({
      id: backendData.id?.toString(),
      userId: backendData.userId?.toString(),
      userType: userType,
      language: backendData.language || 'es',
      viewMode: backendData.viewMode || 'auto',
      subscriptionPlan: backendData.subscriptionPlan || 'basic',
      subscriptionStatus: backendData.subscriptionStatus || 'pending', // *** NUEVO ***
      subscriptionStartDate: backendData.subscriptionStartDate,
      createdAt: backendData.createdAt,
      updatedAt: backendData.updatedAt
    });
  }

  /**
   * Convierte la configuración a un objeto de actualización para el backend
   * Solo incluye los campos que se pueden actualizar
   */
  public toUpdateRequest(): any {
    const updateData: any = {};

    if (this.language) {
      updateData.language = this.language;
    }
    if (this.viewMode) {
      updateData.viewMode = this.viewMode;
    }
    if (this.subscriptionPlan) {
      updateData.subscriptionPlan = this.subscriptionPlan;
    }
    if (this.subscriptionStatus) { // *** NUEVO ***
      updateData.subscriptionStatus = this.subscriptionStatus;
    }

    return updateData;
  }

  /**
   * Clona la configuración actual
   */
  public clone(): Configuration {
    return new Configuration({
      id: this.id,
      userId: this.userId,
      userType: this.userType,
      language: this.language,
      viewMode: this.viewMode,
      subscriptionPlan: this.subscriptionPlan,
      subscriptionStatus: this.subscriptionStatus, // *** NUEVO ***
      subscriptionStartDate: this.subscriptionStartDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    });
  }
}
