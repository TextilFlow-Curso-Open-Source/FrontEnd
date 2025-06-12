// business-request.component.ts
// Cambia el nombre a BusinessRequestsComponent para que coincida con app.routes.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupplierRequestService } from '../../services/supplier-request-service.service';
import { BusinessmanService } from '../../../businessman/services/businessman.service';
import { AuthService } from '../../../auth/services/auth.service';
import { AppButtonComponent } from '../../../core/components/app-button/app-button.component';
import { AppNotificationComponent } from '../../../core/components/app-notification/app-notification.component';
import {TranslateModule} from "@ngx-translate/core";

@Component({
  selector: 'app-business-request',
  standalone: true,
  imports: [
    CommonModule,
    AppButtonComponent,
    AppNotificationComponent,
    TranslateModule
  ],
  templateUrl: './business-request.component.html',
  styleUrls: ['./business-request.component.css']
})
export class BusinessRequestsComponent implements OnInit { // Cambiado a plural
  // Control de pestañas
  activeTab: 'current' | 'new' = 'current';

  // Datos de solicitudes
  requests: any[] = [];
  requestsWithDetails: any[] = [];
  isLoading = false;
  currentUserId = '';

  // ID del proveedor seleccionado para expandir
  selectedBusinessId: string | null = null;

  // Notificación
  notification = {
    show: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'warning' | 'info'
  };

  constructor(
    private requestService: SupplierRequestService,
    private businessmanService: BusinessmanService,
    private authService: AuthService
  ) {
    const user = this.authService.getCurrentUser();
    if (user && user.id) {
      this.currentUserId = user.id;
    }
  }

  ngOnInit() {
    this.loadRequests();
  }

  setActiveTab(tab: 'current' | 'new') {
    this.activeTab = tab;
    this.loadRequests();
  }

  loadRequests() {
    this.isLoading = true;
    this.requestsWithDetails = [];

    this.requestService.getRequestsForSupplier(this.currentUserId).subscribe({
      next: (requests: any[]) => {
        // Filtrar por estado dependiendo de la pestaña activa
        let filteredRequests = requests;
        if (this.activeTab === 'current') {
          filteredRequests = requests.filter(req => req.status === 'accepted');
        } else {
          filteredRequests = requests.filter(req => req.status === 'pending');
        }

        // Usar un Set para evitar duplicados por ID
        const uniqueRequestIds = new Set();
        this.requests = filteredRequests.filter(req => {
          if (uniqueRequestIds.has(req.id)) {
            return false;
          }
          uniqueRequestIds.add(req.id);
          return true;
        });

        // Si no hay solicitudes
        if (this.requests.length === 0) {
          this.isLoading = false;
          return;
        }

        // Para cada solicitud, obtener información del empresario
        let loadedCount = 0;
        this.requests.forEach(request => {
          // CORREGIDO: Cambiar callback por Observable
          this.businessmanService.getProfileByUserId(request.businessmanId).subscribe({
            next: (profile: any) => {
              // Asignar el perfil directamente (no es un array)
              if (profile) {
                this.requestsWithDetails.push({
                  ...request,
                  businessmanProfile: profile
                });
              }

              loadedCount++;
              if (loadedCount === this.requests.length) {
                this.isLoading = false;
              }
            },
            error: (error) => {
              console.error('Error al cargar perfil del empresario:', error);

              loadedCount++;
              if (loadedCount === this.requests.length) {
                this.isLoading = false;
              }
            }
          });
        });
      },
      error: (error: any) => {
        console.error('Error al cargar solicitudes:', error);
        this.isLoading = false;
        this.showNotification('Error al cargar solicitudes', 'error');
      }
    });
  }

  updateRequestStatus(requestId: string, status: 'accepted' | 'rejected') {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    this.requestService.updateRequestStatus(requestId, status).subscribe({
      next: () => {
        this.showNotification(
          `Solicitud ${status === 'accepted' ? 'aceptada' : 'rechazada'} correctamente`,
          'success'
        );

        // Esperar un momento antes de recargar
        setTimeout(() => {
          this.loadRequests();
        }, 500);
      },
      error: (error: any) => {
        console.error('Error al actualizar solicitud:', error);
        this.showNotification('Error al actualizar solicitud', 'error');
        this.isLoading = false;
      }
    });
  }

  toggleDetails(businessId: string) {
    if (this.selectedBusinessId === businessId) {
      this.selectedBusinessId = null;
    } else {
      this.selectedBusinessId = businessId;
    }
  }

  showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info') {
    this.notification = {
      show: true,
      message,
      type
    };
  }

  closeNotification() {
    this.notification.show = false;
  }
}
