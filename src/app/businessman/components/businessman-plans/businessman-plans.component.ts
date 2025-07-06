import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfigurationService} from '../../../configuration/services/configuration.service';
import { PaymentService, PaymentIntentResponse } from '../../../configuration/services/payment.service';
import { AuthService} from '../../../auth/services/auth.service';
import { Configuration} from '../../../configuration/models/configuration.entity';
import { AppButtonComponent} from '../../../core/components/app-button/app-button.component';
import { AppNotificationComponent} from '../../../core/components/app-notification/app-notification.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { loadStripe, Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';
import { environment } from '../../../../environments/environment';

interface PlanFeature {
  key: string;
  icon?: string;
}

interface Plan {
  id: 'basic' | 'corporate';
  name: string;
  price: number;
  period: string;
  features: PlanFeature[];
  buttonText: string;
  buttonVariant: 'secondary' | 'primary';
  isCurrentPlan: boolean;
}

@Component({
  selector: 'app-businessman-plans',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    AppButtonComponent,
    AppNotificationComponent,
    TranslateModule
  ],
  templateUrl: './businessman-plans.component.html',
  styleUrl: './businessman-plans.component.css'
})
export class BusinessmanPlansComponent implements OnInit, OnDestroy {
  currentUserId: string = '';
  configuration: Configuration | null = null;
  currentPlan: 'basic' | 'corporate' = 'basic';

  // Estados del componente
  isLoading = false;
  showUpgradeModal = false;
  showDowngradeModal = false;
  showPaymentModal = false;
  isProcessingPayment = false;
  paymentSuccess = false;

  // Stripe integration
  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private cardElement: StripeCardElement | null = null;
  stripeLoaded = false;
  stripeElementReady = false;

  // Formulario de pago con Stripe
  paymentForm!: FormGroup;

  // Notificaciones
  notification = {
    show: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'warning' | 'info'
  };

  plans: Plan[] = [
    {
      id: 'basic',
      name: 'PLANS.BASIC_PLAN',
      price: 9.99,
      period: 'PLANS.PER_MONTH',
      features: [
        { key: 'PLANS.FEATURE_REGISTER_10_BATCHES' },
        { key: 'PLANS.FEATURE_UPLOAD_20_PHOTOS' },
        { key: 'PLANS.FEATURE_4_PDF_REPORTS' }
      ],
      buttonText: 'PLANS.CHANGE',
      buttonVariant: 'secondary',
      isCurrentPlan: false
    },
    {
      id: 'corporate',
      name: 'PLANS.CORPORATE_PLAN',
      price: 49.99,
      period: 'PLANS.PER_MONTH',
      features: [
        { key: 'PLANS.FEATURE_UNLIMITED_REGISTER' },
        { key: 'PLANS.FEATURE_PERSONALIZED_DASHBOARD' },
        { key: 'PLANS.FEATURE_100_MONTHLY_BATCHES' },
        { key: 'PLANS.FEATURE_QUALITY_PDF_REPORTS' },
        { key: 'PLANS.FEATURE_UNLIMITED_PHOTOS' }
      ],
      buttonText: 'PLANS.YOUR_PLAN',
      buttonVariant: 'primary',
      isCurrentPlan: false
    }
  ];

  constructor(
    private configurationService: ConfigurationService,
    private paymentService: PaymentService,
    private authService: AuthService,
    private fb: FormBuilder,
    private translateService: TranslateService
  ) {
    this.initPaymentForm();
    this.initStripe();
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    console.log('🔍 DEBUG user from authService:', user);

    if (user && user.id) {
      this.currentUserId = user.id;
      console.log('🔍 DEBUG currentUserId set to:', this.currentUserId, 'type:', typeof this.currentUserId);
      this.loadCurrentPlan(); // ← ARREGLADO: Cargar plan actual, no forzar a corporate
    } else {
      console.error('❌ No user found or user.id is missing');
    }
  }

  ngOnDestroy(): void {
    this.fullStripeCleanup();
  }

  /**
   * Initialize Stripe
   */
  private async initStripe(): Promise<void> {
    try {
      console.log('🔄 Initializing Stripe...');
      this.stripe = await loadStripe(environment.stripePublishableKey);

      if (this.stripe) {
        this.stripeLoaded = true;
        console.log('✅ Stripe loaded successfully');
      } else {
        throw new Error('Failed to load Stripe');
      }
    } catch (error) {
      console.error('❌ Error loading Stripe:', error);
      this.showNotification('Error loading payment system', 'error');
    }
  }

  /**
   * Create Stripe Elements for card input - ARREGLADO DEFINITIVAMENTE
   */
  private createStripeElements(): void {
    if (!this.stripe) {
      console.error('❌ Stripe not loaded');
      return;
    }

    // Si ya tenemos un elemento de tarjeta, NO crear otro
    if (this.cardElement) {
      console.log('✅ Card element already exists, reusing it');
      this.stripeElementReady = true;

      // Verificar que esté montado correctamente
      const cardContainer = document.getElementById('card-element');
      if (cardContainer && !cardContainer.querySelector('iframe')) {
        console.log('🔄 Re-mounting existing card element...');
        this.cardElement.mount('#card-element');
      }
      return;
    }

    console.log('🔄 Creating new Stripe elements...');

    // Usar setTimeout para asegurar que el DOM esté listo
    setTimeout(() => {
      const cardContainer = document.getElementById('card-element');
      if (!cardContainer) {
        console.error('❌ Card container not found, retrying...');
        setTimeout(() => this.createStripeElements(), 500);
        return;
      }

      try {
        // Limpiar el contenedor
        cardContainer.innerHTML = '';

        // Crear elements SOLO si no existe
        if (!this.elements) {
          console.log('🔄 Creating new Stripe Elements instance...');
          this.elements = this.stripe!.elements();
        } else {
          console.log('✅ Reusing existing Stripe Elements instance');
        }

        // Crear el elemento de tarjeta SOLO si no existe
        if (!this.cardElement) {
          console.log('🔄 Creating new card element...');
          this.cardElement = this.elements.create('card' as any, {
            style: {
              base: {
                fontSize: '16px',
                color: '#1f2937',
                fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
                fontWeight: '400',
                lineHeight: '1.5',
                backgroundColor: '#ffffff',
                '::placeholder': {
                  color: '#9ca3af',
                },
                iconColor: '#6b7280',
              },
              invalid: {
                color: '#ef4444',
                iconColor: '#ef4444'
              },
              complete: {
                color: '#059669',
                iconColor: '#059669'
              }
            },
            hidePostalCode: true
          });

          // Configurar eventos de Stripe UNA SOLA VEZ
          this.setupStripeEventListeners();
        }

        // Montar el elemento
        console.log('🔄 Mounting card element...');
        this.cardElement!.mount('#card-element');

        console.log('✅ Stripe elements created and mounted successfully');

      } catch (error) {
        console.error('❌ Error creating Stripe elements:', error);
        this.showNotification('Error initializing payment form', 'error');
      }
    }, 800);
  }

  /**
   * Setup Stripe event listeners - SOLO UNA VEZ
   */
  private setupStripeEventListeners(): void {
    if (!this.cardElement) return;

    console.log('🔄 Setting up Stripe event listeners...');

    this.cardElement.on('ready', () => {
      console.log('✅ Stripe card element ready for input');
      this.stripeElementReady = true;

      // Hacer que el elemento sea visible
      const cardContainer = document.getElementById('card-element');
      if (cardContainer) {
        const stripeFrame = cardContainer.querySelector('iframe');
        if (stripeFrame) {
          stripeFrame.style.height = '40px';
          stripeFrame.style.width = '100%';
        }
      }
    });

    this.cardElement.on('change', (event: any) => {
      const displayError = document.getElementById('card-errors');
      if (displayError) {
        if (event.error) {
          displayError.textContent = event.error.message;
        } else {
          displayError.textContent = '';
        }
      }
    });

    this.cardElement.on('focus', () => {
      console.log('Stripe element focused');
    });

    this.cardElement.on('blur', () => {
      console.log('Stripe element blurred');
    });

    console.log('✅ Stripe event listeners configured');
  }

  /**
   * Destroy Stripe elements safely - MEJORADO
   */
  private destroyStripeElements(): void {
    try {
      if (this.cardElement) {
        console.log('🔄 Destroying Stripe card element...');

        // Unmount antes de destroy
        try {
          this.cardElement.unmount();
        } catch (e) {
          console.log('Element was not mounted, skipping unmount');
        }

        // Destroy el elemento
        this.cardElement.destroy();
        this.cardElement = null;
      }

      // NO destruir this.elements - reutilizarlo
      // this.elements = null; ← NO hacer esto

      this.stripeElementReady = false;
      console.log('✅ Stripe card element destroyed (Elements instance preserved)');
    } catch (error) {
      console.error('❌ Error destroying Stripe elements:', error);
      // Resetear manualmente si hay error
      this.cardElement = null;
      this.stripeElementReady = false;
    }
  }

  /**
   * Cleanup completo - SOLO en ngOnDestroy
   */
  private fullStripeCleanup(): void {
    try {
      if (this.cardElement) {
        this.cardElement.destroy();
        this.cardElement = null;
      }

      // Limpiar elements también
      this.elements = null;
      this.stripeElementReady = false;

      console.log('✅ Full Stripe cleanup completed');
    } catch (error) {
      console.error('❌ Error in full cleanup:', error);
    }
  }

  initPaymentForm(): void {
    const currentUser = this.authService.getCurrentUser();

    this.paymentForm = this.fb.group({
      // Datos de facturación
      cardHolder: [currentUser?.name || '', [Validators.required, Validators.minLength(3)]],
      billingAddress: ['', [Validators.required]],
      billingCity: ['', [Validators.required]],
      billingCountry: ['', [Validators.required]],
      billingPhone: ['', [Validators.required]]
    });
  }

  loadCurrentPlan(): void {
    this.isLoading = true;
    const userId = parseInt(this.currentUserId, 10);

    this.configurationService.getConfigurationByUserId(userId).subscribe({
      next: (config) => {
        this.configuration = config;
        this.currentPlan = (this.configuration?.subscriptionPlan as 'basic' | 'corporate') || 'basic';
        this.updatePlansDisplay();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar configuración:', error);
        this.currentPlan = 'basic';
        this.updatePlansDisplay();
        this.isLoading = false;
      }
    });
  }

  updatePlansDisplay(): void {
    this.plans.forEach(plan => {
      plan.isCurrentPlan = plan.id === this.currentPlan;

      if (plan.isCurrentPlan) {
        plan.buttonText = 'PLANS.YOUR_PLAN';
        plan.buttonVariant = 'primary';
      } else {
        if (this.currentPlan === 'basic' && plan.id === 'corporate') {
          plan.buttonText = 'PLANS.UPGRADE';
          plan.buttonVariant = 'primary';
        } else if (this.currentPlan === 'corporate' && plan.id === 'basic') {
          plan.buttonText = 'PLANS.DOWNGRADE';
          plan.buttonVariant = 'secondary';
        } else {
          plan.buttonText = 'PLANS.CHANGE';
          plan.buttonVariant = 'secondary';
        }
      }
    });
  }

  onPlanAction(planId: 'basic' | 'corporate'): void {
    if (planId === this.currentPlan) {
      this.showCurrentPlanDetails();
      return;
    }

    if (this.currentPlan === 'basic' && planId === 'corporate') {
      this.showUpgradeModal = true;
    } else if (this.currentPlan === 'corporate' && planId === 'basic') {
      this.showDowngradeModal = true;
    }
  }

  showCurrentPlanDetails(): void {
    const message = this.translateService.instant('PLANS.CURRENT_PLAN_INFO', {
      plan: this.translateService.instant(`PLANS.${this.currentPlan.toUpperCase()}_PLAN`)
    });
    this.showNotification(message, 'info');
  }

  confirmUpgrade(): void {
    this.showUpgradeModal = false;

    // Mostrar modal de pago
    setTimeout(() => {
      this.showPaymentModal = true;

      // Crear elementos de Stripe después de que el modal sea visible
      setTimeout(() => {
        this.createStripeElements();
      }, 800); // Aumentado para dar más tiempo al DOM
    }, 100);
  }

  confirmDowngrade(): void {
    this.showDowngradeModal = false;
    this.changePlan('basic');
  }

  cancelModal(): void {
    console.log('🔄 Canceling modal...');

    // Limpiar focus activo
    const active = document.activeElement as HTMLElement;
    if (active && typeof active.blur === 'function') {
      active.blur();
    }

    // Ocultar modales
    this.showUpgradeModal = false;
    this.showDowngradeModal = false;
    this.showPaymentModal = false;
    this.paymentSuccess = false;

    // SOLO destruir Stripe Elements si realmente estamos cerrando el modal de pago
    if (!this.showPaymentModal) {
      setTimeout(() => {
        this.destroyStripeElements();
      }, 100);
    }
  }

  /**
   * Process payment with Stripe - VERSIÓN ULTRA DEFENSIVA
   */
  async processPayment(): Promise<void> {
    console.log('🔄 Starting payment process...');

    // Validaciones más estrictas
    const userId = parseInt(this.currentUserId, 10);
    if (isNaN(userId) || userId <= 0) {
      console.error('❌ Invalid userId:', this.currentUserId);
      this.showNotification('Error: Invalid user ID', 'error');
      return;
    }

    if (!this.paymentForm.valid) {
      this.showNotification('Please fill all required fields', 'error');
      return;
    }

    if (!this.stripe) {
      console.error('❌ Stripe not available');
      this.showNotification('Payment system not ready', 'error');
      return;
    }

    // VERIFICACIÓN CRÍTICA: Asegurar que el elemento existe y está montado
    if (!this.cardElement) {
      console.error('❌ Card element not available');
      this.showNotification('Payment form not ready, please wait and try again', 'error');
      return;
    }

    // Verificar que el contenedor DOM existe
    const cardContainer = document.getElementById('card-element');
    if (!cardContainer) {
      console.error('❌ Card container not found in DOM');
      this.showNotification('Payment form error, please close and reopen the modal', 'error');
      return;
    }

    // Verificar que el iframe de Stripe existe
    const stripeIframe = cardContainer.querySelector('iframe');
    if (!stripeIframe) {
      console.error('❌ Stripe iframe not found');
      this.showNotification('Payment form not properly loaded, please try again', 'error');
      return;
    }

    console.log('✅ All Stripe validations passed');

    this.isProcessingPayment = true;

    try {
      console.log('🔄 Creating payment intent...');

      // 1. Crear payment intent en el backend
      const paymentIntentResponse = await this.createPaymentIntent(userId, 'corporate');
      console.log('✅ Payment intent created:', paymentIntentResponse.clientSecret);

      console.log('🔄 Confirming payment with Stripe...');

      // 2. VERIFICAR UNA VEZ MÁS que el elemento sigue disponible antes de usarlo
      if (!this.cardElement) {
        throw new Error('Card element was destroyed during payment process');
      }

      // 3. Confirmar pago con Stripe
      const result = await this.stripe.confirmCardPayment(paymentIntentResponse.clientSecret, {
        payment_method: {
          card: this.cardElement,
          billing_details: {
            name: this.paymentForm.get('cardHolder')?.value,
            address: {
              line1: this.paymentForm.get('billingAddress')?.value,
              city: this.paymentForm.get('billingCity')?.value,
              country: this.paymentForm.get('billingCountry')?.value,
            },
            phone: this.paymentForm.get('billingPhone')?.value,
          },
        },
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      console.log('✅ Payment successful:', result.paymentIntent);

      this.isProcessingPayment = false;
      this.paymentSuccess = true;

      // Mostrar éxito y luego actualizar plan
      setTimeout(() => {
        this.showPaymentModal = false;
        this.paymentSuccess = false;

        // SOLO destruir elementos DESPUÉS de que el pago sea exitoso
        this.destroyStripeElements();

        // *** ARREGLADO: Actualizar plan después del pago exitoso ***
        this.updatePlanAfterSuccessfulPayment();

      }, 2000);

    } catch (error: any) {
      console.error('❌ Payment error:', error);
      this.isProcessingPayment = false;

      // No destruir elementos si hay error - el usuario puede querer reintentar

      this.showNotification(
        error.message || this.translateService.instant('PLANS.PAYMENT_ERROR'),
        'error'
      );
    }
  }

  /**
   * NUEVO MÉTODO: Actualizar plan después del pago exitoso
   */
  private async updatePlanAfterSuccessfulPayment(): Promise<void> {
    if (!this.configuration || !this.configuration.id) {
      console.error('❌ No se encontró configuración válida para actualizar');
      this.showNotification('Error: No se pudo actualizar el plan', 'error');
      this.loadCurrentPlan(); // Fallback: solo recargar
      return;
    }

    const configId = parseInt(this.configuration.id, 10);
    console.log('🔄 Actualizando plan a corporate para configId:', configId);

    this.configurationService.updateSubscriptionPlan(configId, 'corporate').subscribe({
      next: (updatedConfig) => {
        console.log('✅ Plan actualizado exitosamente:', updatedConfig);
        this.configuration = updatedConfig;
        this.currentPlan = 'corporate';
        this.updatePlansDisplay();

        this.showNotification(
          this.translateService.instant('PLANS.PAYMENT_SUCCESS') + ' - ' +
          this.translateService.instant('PLANS.PLAN_ACTIVATED'),
          'success'
        );
      },
      error: (error) => {
        console.error('❌ Error al actualizar el plan después del pago:', error);

        // Mostrar error pero recargar para verificar si el backend se actualizó
        this.showNotification(
          'Pago exitoso, pero hubo un problema actualizando la vista. Recargando...',
          'warning'
        );

        // Recargar después de un momento
        setTimeout(() => {
          this.loadCurrentPlan();
        }, 2000);
      }
    });
  }

  /**
   * Create payment intent via backend
   */
  private createPaymentIntent(userId: number, subscriptionPlan: 'corporate'): Promise<PaymentIntentResponse> {
    console.log('🔍 Creating payment intent with userId:', userId);

    if (isNaN(userId) || userId <= 0) {
      return Promise.reject(new Error('Invalid user ID: ' + userId));
    }

    return new Promise((resolve, reject) => {
      this.paymentService.createPaymentIntent(userId, subscriptionPlan).subscribe({
        next: (response) => {
          console.log('✅ Payment intent response:', response);
          resolve(response);
        },
        error: (error) => {
          console.error('❌ Error creating payment intent:', error);
          reject(error);
        }
      });
    });
  }

  /**
   * Change plan (for downgrades)
   */
  private async changePlan(newPlan: 'basic' | 'corporate'): Promise<void> {
    if (!this.configuration || !this.configuration.id) {
      console.error('No se encontró configuración válida');
      this.showNotification(this.translateService.instant('PLANS.PLAN_CHANGE_ERROR'), 'error');
      return;
    }

    const configId = parseInt(this.configuration.id, 10);

    this.configurationService.updateSubscriptionPlan(configId, newPlan).subscribe({
      next: (updatedConfig) => {
        this.configuration = updatedConfig;
        this.currentPlan = newPlan;
        this.updatePlansDisplay();
        this.showNotification(
          this.translateService.instant('PLANS.PLAN_CHANGED_SUCCESS'),
          'success'
        );
      },
      error: (error) => {
        console.error('Error al actualizar configuración:', error);
        this.showNotification(this.translateService.instant('PLANS.PLAN_CHANGE_ERROR'), 'error');
      }
    });
  }

  showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.notification = {
      show: true,
      message,
      type
    };

    setTimeout(() => {
      this.notification.show = false;
    }, 3000);
  }

  getTargetPlan(): Plan | undefined {
    return this.plans.find(plan => plan.id === 'corporate');
  }

  formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  }
}
