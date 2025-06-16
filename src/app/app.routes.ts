import { Routes } from '@angular/router';

// Importación directa de componentes principales
import { UserLoginComponent } from './auth/views/user-login/user-login.component';
import { UserRegisterComponent } from './auth/views/user-register/user-register.component';
import { UserRoleSelectorComponent } from './auth/views/user-role-selector/user-role-selector.component';


// Lazy loading para los layouts y componentes
const BusinessmanLayoutComponent = () => import('./businessman/layout/businessman-layout/businessman-layout.component').then(m => m.BusinessmanLayoutComponent);
const SupplierLayoutComponent = () => import('./supplier/layout/supplier-layout/supplier-layout.component').then(m => m.SupplierLayoutComponent);
import { ForgotPasswordComponent } from './auth/views/forgot-password/forgot-password.component';

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
  // Rutas para Businessman
  {
    path: 'businessman',
    loadComponent: BusinessmanLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full'
      },
      {
        path: 'inicio',
        loadComponent: BusinessmanHomeComponent
      },
      {
        path: 'lotes',
        loadComponent: BusinessmanBatchComponent
      },
      {
        path: 'observaciones',
        loadComponent: BusinessmanObservationComponent
      },
      {
        path: 'planes',
        loadComponent: BusinessmanPlansComponent
      },
      {
        path: 'buscar-distribuidor',
        loadComponent: AddSupplierComponent
      },
      {
        path: 'configuracion',
        loadComponent: ConfiguracionComponent
      },
      {
        path: 'perfil',
        loadComponent: PerfilComponent
      }
    ]
  },

  // Rutas para Supplier
  {
    path: 'supplier',
    loadComponent: SupplierLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full'
      },
      {
        path: 'inicio',
        loadComponent: SupplierHomeComponent
      },
      {
        path: 'mis-lotes',
        loadComponent: SupplierBatchComponent
      },
      {
        path: 'registrar-lotes',
        loadComponent: SupplierRegisterBatchComponent
      },
      {
        path: 'observaciones',
        loadComponent: SupplierObservationComponent
      },
      {
        path: 'solicitudes-recibidas',
        loadComponent: BusinessRequestsComponent
      },
      {
        path: 'planes',
        loadComponent: SupplierPlansComponent
      },
      {
        path: 'configuracion',
        loadComponent: SupplierConfigComponent
      },
      {
        path: 'perfil',
        loadComponent: SupplierPerfilComponent
      }
    ]
  },

  // Ruta para página no encontrada
  {
    path: '**',
    loadComponent: PageNotFoundComponent
  }
];
