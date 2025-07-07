import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {Router, RouterModule} from '@angular/router';
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

  // *** NUEVAS PROPIEDADES PARA SELECCIÓN DE PLAN ***
  showPlanSelectionBanner = false;  // Mostrar banner de "elige tu plan"
  selectedPlanForPayment: 'basic' | 'corporate' = 'basic'; // Plan seleccionado para pagar
  isFirstTimeUser = false; // Si es la primera vez que necesita pagar

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
    private translateService: TranslateService,
    private router: Router
  ) {
    this.initPaymentForm();
    this.initStripe();
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();

    if (user && user.id) {
      this.currentUserId = user.id;

      // Cargar plan actual (que automáticamente verificará si mostrar selección de plan)
      this.loadCurrentPlan();

      // *** NUEVO: Verificar si viene de un registro reciente ***
      const fromRegistration = sessionStorage.getItem('fromRegistration');
      if (fromRegistration === 'true') {
        sessionStorage.removeItem('fromRegistration');

        setTimeout(() => {
          this.showNotification(
            '¡Bienvenido! Para comenzar a usar TextilFlow, selecciona y activa tu plan.',
            'info'
          );
        }, 500);
      }
    } else {
      console.error('❌ No user found or user.id is missing');
    }
  }

  ngOnDestroy(): void {
    this.fullStripeCleanup();
  }

  // ===================== MÉTODOS STRIPE (SIN CAMBIOS) =====================

  private async initStripe(): Promise<void> {
    try {
      this.stripe = await loadStripe(environment.stripePublishableKey);

      if (this.stripe) {
        this.stripeLoaded = true;
      } else {
        throw new Error('Failed to load Stripe');
      }
    } catch (error) {
      console.error('❌ Error loading Stripe:', error);
      this.showNotification('Error loading payment system', 'error');
    }
  }

  private createStripeElements(): void {
    if (!this.stripe) {
      console.error('❌ Stripe not loaded');
      return;
    }

    if (this.cardElement) {
      this.stripeElementReady = true;

      const cardContainer = document.getElementById('card-element');
      if (cardContainer && !cardContainer.querySelector('iframe')) {
        this.cardElement.mount('#card-element');
      }
      return;
    }



    setTimeout(() => {
      const cardContainer = document.getElementById('card-element');
      if (!cardContainer) {
        console.error('❌ Card container not found, retrying...');
        setTimeout(() => this.createStripeElements(), 500);
        return;
      }

      try {
        cardContainer.innerHTML = '';

        if (!this.elements) {
          this.elements = this.stripe!.elements();
        } else {
        }

        if (!this.cardElement) {
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

          this.setupStripeEventListeners();
        }


        this.cardElement!.mount('#card-element');



      } catch (error) {
        console.error('❌ Error creating Stripe elements:', error);
        this.showNotification('Error initializing payment form', 'error');
      }
    }, 800);
  }

  private setupStripeEventListeners(): void {
    if (!this.cardElement) return;



    this.cardElement.on('ready', () => {

      this.stripeElementReady = true;

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

  private destroyStripeElements(): void {
    try {
      if (this.cardElement) {
        console.log('🔄 Destroying Stripe card element...');

        try {
          this.cardElement.unmount();
        } catch (e) {
          console.log('Element was not mounted, skipping unmount');
        }

        this.cardElement.destroy();
        this.cardElement = null;
      }

      this.stripeElementReady = false;
      console.log('✅ Stripe card element destroyed (Elements instance preserved)');
    } catch (error) {
      console.error('❌ Error destroying Stripe elements:', error);
      this.cardElement = null;
      this.stripeElementReady = false;
    }
  }

  private fullStripeCleanup(): void {
    try {
      if (this.cardElement) {
        this.cardElement.destroy();
        this.cardElement = null;
      }

      this.elements = null;
      this.stripeElementReady = false;

      console.log('✅ Full Stripe cleanup completed');
    } catch (error) {
      console.error('❌ Error in full cleanup:', error);
    }
  }

  // ===================== MÉTODOS DE CONFIGURACIÓN =====================

  initPaymentForm(): void {
    const currentUser = this.authService.getCurrentUser();

    this.paymentForm = this.fb.group({
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

        // *** NUEVO: Verificar si debe mostrar selección de plan ***
        this.checkAndShowPlanSelection();
      },
      error: (error) => {
        console.error('Error al cargar configuración:', error);
        this.currentPlan = 'basic';
        this.updatePlansDisplay();
        this.isLoading = false;

        // *** NUEVO: Si hay error, asumir que necesita pagar ***
        console.log('❌ Error loading configuration - showing plan selection as fallback');
        this.showPlanSelectionFlow();
      }
    });
  }

  // ===================== NUEVOS MÉTODOS PARA SELECCIÓN DE PLAN =====================

  /**
   * MÉTODO CORREGIDO: Verificar si debe mostrar selección de plan
   */
  private checkAndShowPlanSelection(): void {
    console.log('🔍 === checkAndShowPlanSelection START ===');
    console.log('Configuration:', this.configuration);
    console.log('SubscriptionStatus:', this.configuration?.subscriptionStatus);
    console.log('Type of status:', typeof this.configuration?.subscriptionStatus);

    if (!this.configuration) {
      console.log('⚠️ No configuration found - showing plan selection');
      this.showPlanSelectionFlow();
      return;
    }

    const status = this.configuration.subscriptionStatus;

    // *** CORRECCIÓN: Verificar tanto mayúsculas como minúsculas ***
    if (status === 'pending' || status === 'PENDING') {
      console.log('⏳ Subscription status is PENDING - showing plan selection');
      this.showPlanSelectionFlow();
      return;
    }

    if (status === 'expired' || status === 'EXPIRED') {
      console.log('⚠️ Subscription status is EXPIRED - showing plan selection');
      this.showPlanSelectionFlow();
      return;
    }

    if (status === 'active' || status === 'ACTIVE') {
      console.log('✅ Subscription is ACTIVE - hiding plan selection');
      this.showPlanSelectionBanner = false;
      this.isFirstTimeUser = false;

      // Mostrar notificación de bienvenida solo una vez
      if (!sessionStorage.getItem('welcomeShown')) {
        this.showNotification(
          'Su suscripción está activa. ¡Bienvenido a TextilFlow!',
          'success'
        );
        sessionStorage.setItem('welcomeShown', 'true');
      }
      return;
    }

    console.log('❓ Unknown subscription status:', status, '- showing plan selection by default');
    this.showPlanSelectionFlow();
    console.log('🔍 === checkAndShowPlanSelection END ===');
  }

  /**
   * NUEVO MÉTODO: Mostrar flujo de selección de plan
   */
  private showPlanSelectionFlow(): void {
    console.log('🎯 Starting plan selection flow...');

    this.isFirstTimeUser = true;
    this.showPlanSelectionBanner = true;

    // Establecer plan por defecto (el que ya tiene)
    this.selectedPlanForPayment = this.currentPlan;

    // Actualizar display de selección
    this.updatePlanSelectionDisplay();

    // Mostrar mensaje informativo
    this.showNotification(
      'Bienvenido a TextilFlow. Para comenzar, selecciona y activa tu plan de suscripción.',
      'info'
    );
  }

  /**
   * NUEVO MÉTODO: Usuario selecciona un plan para pagar
   */
  public selectPlanForPayment(planId: 'basic' | 'corporate'): void {
    this.selectedPlanForPayment = planId;
    this.updatePlanSelectionDisplay();
  }

  /**
   * NUEVO MÉTODO: Proceder al pago con el plan seleccionado
   */
  public proceedToPayment(): void {

    this.showPlanSelectionBanner = false;
    this.showPaymentModal = true;
    setTimeout(() => {
      this.createStripeElements();
    }, 800);
  }

  /**
   * NUEVO MÉTODO: Actualizar display de selección de planes
   */
  private updatePlanSelectionDisplay(): void {
    this.plans.forEach(plan => {
      plan.isCurrentPlan = (plan.id === this.selectedPlanForPayment);

      if (plan.id === this.selectedPlanForPayment) {
        plan.buttonText = 'PLANS.SELECTED';
        plan.buttonVariant = 'primary';
      } else {
        plan.buttonText = 'PLANS.SELECT_THIS_PLAN';
        plan.buttonVariant = 'secondary';
      }
    });
  }

  // ===================== MÉTODOS MODIFICADOS =====================

  updatePlansDisplay(): void {
    if (this.showPlanSelectionBanner) {
      this.updatePlanSelectionDisplay();
      return;
    }

    // Lógica original para usuarios con suscripción activa
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

  /**
   * MÉTODO MODIFICADO: Manejar acción de plan
   */
  public onPlanAction(planId: 'basic' | 'corporate'): void {
    // Si está en modo de selección de plan para primera vez
    if (this.showPlanSelectionBanner) {
      this.selectPlanForPayment(planId);
      return;
    }

    // Lógica original para usuarios que ya tienen suscripción activa
    if (planId === this.currentPlan) {
      this.showCurrentPlanDetails();
      return;
    }

    if (this.currentPlan === 'basic' && planId === 'corporate') {
      this.selectedPlanForPayment = 'corporate';
      this.showUpgradeModal = true;
    } else if (this.currentPlan === 'corporate' && planId === 'basic') {
      this.selectedPlanForPayment = 'basic';
      this.showDowngradeModal = true;
    }
  }

  // ===================== MÉTODOS DE PAGO MODIFICADOS =====================

  /**
   * MÉTODO MODIFICADO: Process payment (usar plan seleccionado)
   */
  async processPayment(): Promise<void> {
    console.log('🔄 Starting payment process for plan:', this.selectedPlanForPayment);

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

    if (!this.cardElement) {
      console.error('❌ Card element not available');
      this.showNotification('Payment form not ready, please wait and try again', 'error');
      return;
    }

    const cardContainer = document.getElementById('card-element');
    if (!cardContainer) {
      console.error('❌ Card container not found in DOM');
      this.showNotification('Payment form error, please close and reopen the modal', 'error');
      return;
    }

    const stripeIframe = cardContainer.querySelector('iframe');
    if (!stripeIframe) {
      console.error('❌ Stripe iframe not found');
      this.showNotification('Payment form not properly loaded, please try again', 'error');
      return;
    }


    this.isProcessingPayment = true;

    try {

      // *** USAR EL PLAN SELECCIONADO ***
      const paymentIntentResponse = await this.createPaymentIntent(userId, this.selectedPlanForPayment);

      if (!this.cardElement) {
        throw new Error('Card element was destroyed during payment process');
      }

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


      this.isProcessingPayment = false;
      this.paymentSuccess = true;

      setTimeout(() => {
        this.showPaymentModal = false;
        this.paymentSuccess = false;

        this.destroyStripeElements();

        // *** ACTUALIZAR PLAN DESPUÉS DEL PAGO EXITOSO ***
        this.updatePlanAfterSuccessfulPayment();

      }, 2000);

    } catch (error: any) {
      console.error('❌ Payment error:', error);
      this.isProcessingPayment = false;

      this.showNotification(
        error.message || this.translateService.instant('PLANS.PAYMENT_ERROR'),
        'error'
      );
    }
  }

  /**
   * MÉTODO MODIFICADO: Actualizar plan después del pago (usar plan seleccionado)
   */
  private async updatePlanAfterSuccessfulPayment(): Promise<void> {
    if (!this.configuration || !this.configuration.id) {
      console.error('❌ No se encontró configuración válida para actualizar');
      this.showNotification('Error: No se pudo actualizar el plan', 'error');
      this.loadCurrentPlan();
      return;
    }

    const userId = parseInt(this.currentUserId, 10);

    // *** USAR EL PLAN QUE EL USUARIO SELECCIONÓ ***
    this.configurationService.activateSubscription(userId, this.selectedPlanForPayment).subscribe({
      next: (updatedConfig) => {

        if (updatedConfig.subscriptionStatus !== 'active' && updatedConfig.subscriptionStatus !== 'ACTIVE') {
          console.error('❌ WARNING: Backend no retornó status active:', updatedConfig.subscriptionStatus);
        }

        // Actualizar estado local
        this.configuration = updatedConfig;
        this.currentPlan = this.selectedPlanForPayment;
        this.isFirstTimeUser = false;
        this.showPlanSelectionBanner = false;
        this.updatePlansDisplay();

        // Notificar éxito
        this.showNotification(
          this.translateService.instant('PLANS.PAYMENT_SUCCESS') + ' - ' +
          this.translateService.instant('PLANS.PLAN_ACTIVATED'),
          'success'
        );

        // Redirigir al dashboard
        setTimeout(() => {
          this.router.navigate(['/businessman/inicio']).then(() => {
          }).catch((error: any) => {
            console.error('❌ Error redirecting:', error);
            // Fallback: reload si la redirección falla
            window.location.reload();
          });
        }, 2000);
      },
      error: (error) => {
        console.error('❌ Error al activar suscripción después del pago:', error);

        // *** DEBUGGING: Verificar qué error específico ***
        console.error('   Error details:', {
          status: error.status,
          message: error.message,
          error: error.error
        });

        this.showNotification(
          'Pago exitoso, pero hubo un problema activando la suscripción. Verificando...',
          'warning'
        );
        setTimeout(() => this.loadCurrentPlan(), 3000);
      }
    });
  }

  /**
   * MÉTODO MODIFICADO: Crear payment intent (usar plan seleccionado)
   */
  private createPaymentIntent(userId: number, subscriptionPlan: 'basic' | 'corporate'): Promise<PaymentIntentResponse> {

    if (isNaN(userId) || userId <= 0) {
      return Promise.reject(new Error('Invalid user ID: ' + userId));
    }

    return new Promise((resolve, reject) => {
      // *** USAR EL PLAN SELECCIONADO ***
      this.paymentService.createPaymentIntent(userId, this.selectedPlanForPayment).subscribe({
        next: (response) => {
          resolve(response);
        },
        error: (error) => {
          console.error('❌ Error creating payment intent:', error);
          reject(error);
        }
      });
    });
  }

  // ===================== MÉTODOS EXISTENTES SIN CAMBIOS =====================

  showCurrentPlanDetails(): void {
    const message = this.translateService.instant('PLANS.CURRENT_PLAN_INFO', {
      plan: this.translateService.instant(`PLANS.${this.currentPlan.toUpperCase()}_PLAN`)
    });
    this.showNotification(message, 'info');
  }

  confirmUpgrade(): void {
    this.showUpgradeModal = false;

    setTimeout(() => {
      this.showPaymentModal = true;

      setTimeout(() => {
        this.createStripeElements();
      }, 800);
    }, 100);
  }

  confirmDowngrade(): void {
    this.showDowngradeModal = false;
    this.changePlan('basic');
  }

  cancelModal(): void {
    console.log('🔄 Canceling modal...');

    const active = document.activeElement as HTMLElement;
    if (active && typeof active.blur === 'function') {
      active.blur();
    }

    this.showUpgradeModal = false;
    this.showDowngradeModal = false;
    this.showPaymentModal = false;
    this.paymentSuccess = false;

    if (!this.showPaymentModal) {
      setTimeout(() => {
        this.destroyStripeElements();
      }, 100);
    }
  }

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
    return `${price.toFixed(2)}`;
  }

  // ===================== MÉTODO DE DEBUGGING =====================

  /**
   * MÉTODO TEMPORAL: Para debugging - verificar estado actual
   */
  public debugCurrentSubscriptionStatus(): void {
    console.log('🔍 === DEBUGGING SUBSCRIPTION STATUS ===');
    console.log('Configuration object:', this.configuration);
    console.log('SubscriptionStatus value:', this.configuration?.subscriptionStatus);
    console.log('SubscriptionStatus type:', typeof this.configuration?.subscriptionStatus);
    console.log('ShowPlanSelectionBanner:', this.showPlanSelectionBanner);
    console.log('IsFirstTimeUser:', this.isFirstTimeUser);
    console.log('CurrentPlan:', this.currentPlan);
    console.log('=======================================');

    // Verificar si el problema está en el checkAndShowPlanSelection
    if (this.configuration?.subscriptionStatus === 'ACTIVE' || this.configuration?.subscriptionStatus === 'active') {
      console.log('✅ Status is ACTIVE - banner should be hidden');
      if (this.showPlanSelectionBanner) {
        console.error('❌ BUG: Banner is showing but status is ACTIVE!');
        // Forzar ocultar banner
        this.showPlanSelectionBanner = false;
        this.isFirstTimeUser = false;
      }
    } else {
      console.log('⚠️ Status is not ACTIVE:', this.configuration?.subscriptionStatus);
    }
  }
}
