import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfigurationService} from '../../../configuration/services/configuration.service';
import { AuthService} from '../../../auth/services/auth.service';
import { Configuration} from '../../../configuration/models/configuration.entity';
import { AppButtonComponent} from '../../../core/components/app-button/app-button.component';
import { AppInputComponent} from '../../../core/components/app-input/app-input.component';
import { AppNotificationComponent} from '../../../core/components/app-notification/app-notification.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
    AppInputComponent,
    AppNotificationComponent,
    TranslateModule
  ],
  templateUrl: './businessman-plans.component.html',
  styleUrl: './businessman-plans.component.css'
})
export class BusinessmanPlansComponent implements OnInit {
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

  // Formulario de pago simulado
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
    private authService: AuthService,
    private fb: FormBuilder,
    private translateService: TranslateService
  ) {
    this.initPaymentForm();
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.id) {
      this.currentUserId = user.id;
      this.loadCurrentPlan();
    }
  }

  initPaymentForm(): void {
    // Obtener datos del usuario actual para pre-llenar nombre
    const currentUser = this.authService.getCurrentUser();

    this.paymentForm = this.fb.group({
      // Datos de tarjeta
      cardNumber: ['4111-1111-1111-1111', [Validators.required, Validators.pattern(/^\d{4}-\d{4}-\d{4}-\d{4}$/)]],
      expiryDate: ['12/25', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}$/)]],
      cvv: ['123', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
      cardHolder: [currentUser?.name || '', [Validators.required, Validators.minLength(3)]],

      // Datos de facturación (temporales, no se guardan)
      billingAddress: ['', [Validators.required]],
      billingCity: ['', [Validators.required]],
      billingCountry: ['', [Validators.required]],
      billingPhone: ['', [Validators.required]]
    });
  }

  // ARREGLO 1: Usar el nuevo método getConfigurationByUserId
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
      // Es el plan actual, mostrar detalles
      this.showCurrentPlanDetails();
      return;
    }

    if (this.currentPlan === 'basic' && planId === 'corporate') {
      // Upgrade
      this.showUpgradeModal = true;
    } else if (this.currentPlan === 'corporate' && planId === 'basic') {
      // Downgrade
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
    this.showPaymentModal = true;
  }

  confirmDowngrade(): void {
    this.showDowngradeModal = false;
    this.changePlan('basic');
  }

  cancelModal(): void {
    this.showUpgradeModal = false;
    this.showDowngradeModal = false;
    this.showPaymentModal = false;
    this.paymentSuccess = false;
  }

  async processPayment(): Promise<void> {
    if (!this.paymentForm.valid) {
      this.showNotification(this.translateService.instant('PLANS.INVALID_PAYMENT_DATA'), 'error');
      return;
    }

    this.isProcessingPayment = true;

    try {
      // Simulación de pago
      await this.simulatePayment();

      this.isProcessingPayment = false;
      this.paymentSuccess = true;

      // Esperar un poco para mostrar el éxito y luego cambiar plan
      setTimeout(() => {
        this.showPaymentModal = false;
        this.paymentSuccess = false;
        this.changePlan('corporate');
      }, 2000);

    } catch (error) {
      this.isProcessingPayment = false;
      this.showNotification(this.translateService.instant('PLANS.PAYMENT_ERROR'), 'error');
    }
  }

  private simulatePayment(): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 90% éxito, 10% fallo para demo
        if (Math.random() > 0.1) {
          resolve();
        } else {
          reject(new Error('Pago simulado falló'));
        }
      }, 2500); // 2.5 segundos de "procesamiento"
    });
  }

  // ARREGLO 2: Actualizar para usar el nuevo backend
  private async changePlan(newPlan: 'basic' | 'corporate'): Promise<void> {
    if (!this.configuration || !this.configuration.id) {
      // ERROR: No debería llegar aquí porque el backend crea automáticamente la configuración
      console.error('No se encontró configuración válida');
      this.showNotification(this.translateService.instant('PLANS.PLAN_CHANGE_ERROR'), 'error');
      return;
    }

    const configId = parseInt(this.configuration.id, 10);

    // ARREGLO 3: Usar updateSubscriptionPlan en lugar de update
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

    // Auto-ocultar después de 3 segundos
    setTimeout(() => {
      this.notification.show = false;
    }, 3000);
  }

  // Método helper para obtener el plan que se está comprando
  getTargetPlan(): Plan | undefined {
    return this.plans.find(plan => plan.id === 'corporate');
  }

  // Método helper para formatear precio
  formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  }
}
