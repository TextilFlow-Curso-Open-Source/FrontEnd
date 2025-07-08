import { Routes } from '@angular/router';

// Importación directa de componentes principales
import { UserLoginComponent } from './auth/views/user-login/user-login.component';
import { UserRegisterComponent } from './auth/views/user-register/user-register.component';
import { UserRoleSelectorComponent } from './auth/views/user-role-selector/user-role-selector.component';
import { ForgotPasswordComponent } from './auth/views/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './auth/views/reset-password/reset-password.component';
// *** NUEVO: Import del Subscription Guard ***
import { SubscriptionGuard } from './core/guards/subscription.guard';

// Lazy loading para los layouts y componentes
const BusinessmanLayoutComponent = () => import('./businessman/layout/businessman-layout/businessman-layout.component').then(m => m.BusinessmanLayoutComponent);
const SupplierLayoutComponent = () => import('./supplier/layout/supplier-layout/supplier-layout.component').then(m => m.SupplierLayoutComponent);

// Componentes de Businessman (lazy loaded)
const BusinessmanHomeComponent = () => import('./businessman/components/businessman-home/businessman-home.component').then(m => m.BusinessmanHomeComponent);
const BusinessmanBatchComponent = () => import('./batch/components/businessman-batch/businessman-batch.component').then(m => m.BusinessmanBatchComponent);
const BusinessmanObservationComponent = () => import('./observation/components/businessman-observation/businessman-observation.component').then(m => m.BusinessmanObservationComponent);
const BusinessmanPlansComponent = () => import('./businessman/components/businessman-plans/businessman-plans.component').then(m => m.BusinessmanPlansComponent);
const ConfiguracionComponent = () => import('./configuration/components/businessman-configuration/businessman-configuration.component').then(m => m.BusinessmanConfigurationComponent);
const PerfilComponent = () => import('./configuration/components/businessman-profile-configuration/businessman-profile-configuration.component').then(m => m.BusinessmanProfileConfigurationComponent);

// Componentes en el módulo requests
const AddSupplierComponent = () => import('./requests/components/add-supplier/add-supplier.component').then(m => m.AddSupplierComponent);
const BusinessRequestsComponent = () => import('./requests/components/business-request/business-request.component').then(m => m.BusinessRequestsComponent);

// Componentes de Supplier (lazy loaded)
const SupplierHomeComponent = () => import('./supplier/components/supplier-home/supplier-home.component').then(m => m.SupplierHomeComponent);
const SupplierBatchComponent = () => import('./batch/components/supplier-batch/supplier-batch.component').then(m => m.SupplierBatchComponent);
const SupplierRegisterBatchComponent = () => import('./batch/components/supplier-register-batch/supplier-register-batch.component').then(m => m.SupplierRegisterBatchComponent);
const SupplierObservationComponent = () => import('./observation/components/supplier-observation/supplier-observation.component').then(m => m.SupplierObservationComponent);
const SupplierPlansComponent = () => import('./supplier/components/supplier-plans/supplier-plans.component').then(m => m.SupplierPlansComponent);
const SupplierConfigComponent = () => import('./configuration/components/supplier-configuration/supplier-configuration.component').then(m => m.SupplierConfigurationComponent);
const SupplierPerfilComponent = () => import('./configuration/components/supplier-profile-configuration/supplier-profile-configuration.component').then(m => m.SupplierProfileConfigurationComponent);

// Página no encontrada
const PageNotFoundComponent = () => import('./core/components/page-not-found/page-not-found.component').then(m => m.PageNotFoundComponent);

export const routes: Routes = [
  // Ruta raíz redirige a login
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  // Ruta de login
  {
    path: 'login',
    component: UserLoginComponent
  },

  {
    path: 'select-role',
    component: UserRoleSelectorComponent
  },

  // Ruta de registro
  {
    path: 'register',
    component: UserRegisterComponent
  },

  {
    path: 'forgot-password',
    component: ForgotPasswordComponent
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent
  },

  // *** UPDATED: Rutas para Businessman con SubscriptionGuard ***
  {
    path: 'businessman',
    loadComponent: BusinessmanLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'planes',  // ← CHANGED: Redirect to plans instead of inicio
        pathMatch: 'full'
      },
      {
        path: 'planes',
        loadComponent: BusinessmanPlansComponent
        // ← NO GUARD: /planes always accessible for payment
      },
      {
        path: 'inicio',
        loadComponent: BusinessmanHomeComponent,
        canActivate: [SubscriptionGuard]  // ← NEW: Guard applied
      },
      {
        path: 'lotes',
        loadComponent: BusinessmanBatchComponent,
        canActivate: [SubscriptionGuard]  // ← NEW: Guard applied
      },
      {
        path: 'observaciones',
        loadComponent: BusinessmanObservationComponent,
        canActivate: [SubscriptionGuard]  // ← NEW: Guard applied
      },
      {
        path: 'buscar-distribuidor',
        loadComponent: AddSupplierComponent,
        canActivate: [SubscriptionGuard]  // ← NEW: Guard applied
      },
      {
        path: 'configuracion',
        loadComponent: ConfiguracionComponent,
        canActivate: [SubscriptionGuard]  // ← NEW: Guard applied
      },
      {
        path: 'perfil',
        loadComponent: PerfilComponent,
        canActivate: [SubscriptionGuard]  // ← NEW: Guard applied
      }
    ]
  },

  // *** UPDATED: Rutas para Supplier con SubscriptionGuard ***
  {
    path: 'supplier',
    loadComponent: SupplierLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'planes',  // ← CHANGED: Redirect to plans instead of inicio
        pathMatch: 'full'
      },
      {
        path: 'planes',
        loadComponent: SupplierPlansComponent
        // ← NO GUARD: /planes always accessible for payment
      },
      {
        path: 'inicio',
        loadComponent: SupplierHomeComponent,
        canActivate: [SubscriptionGuard]  // ← NEW: Guard applied
      },
      {
        path: 'mis-lotes',
        loadComponent: SupplierBatchComponent,
        canActivate: [SubscriptionGuard]  // ← NEW: Guard applied
      },
      {
        path: 'registrar-lotes',
        loadComponent: SupplierRegisterBatchComponent,
        canActivate: [SubscriptionGuard]  // ← NEW: Guard applied
      },
      {
        path: 'observaciones',
        loadComponent: SupplierObservationComponent,
        canActivate: [SubscriptionGuard]  // ← NEW: Guard applied
      },
      {
        path: 'solicitudes-recibidas',
        loadComponent: BusinessRequestsComponent,
        canActivate: [SubscriptionGuard]  // ← NEW: Guard applied
      },
      {
        path: 'configuracion',
        loadComponent: SupplierConfigComponent,
        canActivate: [SubscriptionGuard]  // ← NEW: Guard applied
      },
      {
        path: 'perfil',
        loadComponent: SupplierPerfilComponent,
        canActivate: [SubscriptionGuard]  // ← NEW: Guard applied
      }
    ]
  },

  // Ruta para página no encontrada
  {
    path: '**',
    loadComponent: PageNotFoundComponent
  }
];
