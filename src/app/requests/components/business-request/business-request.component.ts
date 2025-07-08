// business-request.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupplierRequestService } from '../../services/supplier-request-service.service';
import { BusinessmanService } from '../../../businessman/services/businessman.service';
import { AuthService } from '../../../auth/services/auth.service';
import { AppButtonComponent } from '../../../core/components/app-button/app-button.component';
import { AppNotificationComponent } from '../../../core/components/app-notification/app-notification.component';
import { TranslateModule } from "@ngx-translate/core";

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
export class BusinessRequestsComponent implements OnInit {
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


// Llamar este método en ngOnInit() temporalmente
  ngOnInit() {
    this.loadRequests();
  }

  setActiveTab(tab: 'current' | 'new') {
    this.activeTab = tab;
    this.selectedBusinessId = null; // Reset expansion when changing tabs
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
          filteredRequests = requests.filter(req => req.status === 'ACCEPTED');
        } else {
          filteredRequests = requests.filter(req => req.status === 'PENDING');
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
          this.businessmanService.getProfileByUserId(request.businessmanId).subscribe({
            next: (profile: any) => {
              if (profile) {
                this.requestsWithDetails.push({
                  ...request,
                  businessmanProfile: profile
                });
              }

              loadedCount++;
              if (loadedCount === this.requests.length) {
                this.isLoading = false;
                // Ordenar por fecha de solicitud (más recientes primero)
                this.requestsWithDetails.sort((a, b) =>
                  new Date(b.createdAt || b.requestDate || 0).getTime() -
                  new Date(a.createdAt || a.requestDate || 0).getTime()
                );
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
        const messageKey = status === 'accepted' ? 'REQUEST_ACCEPTED' : 'REQUEST_REJECTED';
        this.showNotification(
          messageKey, // Usar claves de i18n en lugar de texto hardcoded
          'success'
        );

        // Esperar un momento antes de recargar
        setTimeout(() => {
          this.loadRequests();
        }, 500);
      },
      error: (error: any) => {
        console.error('Error al actualizar solicitud:', error);
        this.showNotification('ERROR_UPDATING_REQUEST', 'error');
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

  /**
   * Contactar al empresario (llamar, enviar email, etc.)
   */
  contactBusinessman(businessmanProfile: any) {
    if (!businessmanProfile) {
      this.showNotification('ERROR_BUSINESSMAN_INFO', 'error');
      return;
    }

    // Opción 1: Abrir el cliente de email del usuario
    if (businessmanProfile.email || businessmanProfile.contactEmail) {
      const email = businessmanProfile.email || businessmanProfile.contactEmail;
      const subject = encodeURIComponent('Contacto desde TextilFlow');
      const body = encodeURIComponent(`Hola ${businessmanProfile.contactName || businessmanProfile.companyName},\n\nMe pongo en contacto contigo desde TextilFlow.\n\nSaludos.`);
      window.open(`mailto:${email}?subject=${subject}&body=${body}`);

      this.showNotification('CONTACTING_BUSINESSMAN', 'info');
      return;
    }

    // Opción 2: Llamar si hay teléfono
    if (businessmanProfile.phone) {
      window.open(`tel:${businessmanProfile.phone}`);
      return;
    }

    // Si no hay información de contacto
    this.showNotification('ERROR_NO_CONTACT_INFO', 'warning');
  }

  /**
   * Ver historial de solicitudes con este empresario
   */
  viewRequestHistory(businessmanId: string) {
    // Filtrar todas las solicitudes de este empresario
    const businessmanRequests = this.requests.filter(req => req.businessmanId === businessmanId);

    if (businessmanRequests.length === 0) {
      this.showNotification('NO_REQUEST_HISTORY', 'info');
      return;
    }

    // Por ahora, mostrar información básica en consola
    // TODO: Implementar modal o navegación a página de historial
    console.log('Historial de solicitudes:', businessmanRequests);

    // Mostrar notificación temporal
    this.showNotification(
      `Historial encontrado: ${businessmanRequests.length} solicitudes`,
      'info'
    );

    // Aquí podrías:
    // 1. Abrir un modal con el historial
    // 2. Navegar a una página dedicada
    // 3. Expandir una sección en el mismo componente
  }

  /**
   * Enviar mensaje directo al empresario
   */
  sendMessage(businessmanProfile: any) {
    if (!businessmanProfile) {
      this.showNotification('ERROR_BUSINESSMAN_INFO', 'error');
      return;
    }

    // Por ahora, usar email como método de mensaje
    // TODO: Implementar sistema de mensajería interno
    this.contactBusinessman(businessmanProfile);

    // Alternativa: Abrir WhatsApp si hay teléfono
    /*
    if (businessmanProfile.phone) {
      const message = encodeURIComponent('Hola, me pongo en contacto desde TextilFlow');
      window.open(`https://wa.me/${businessmanProfile.phone}?text=${message}`);
      this.showNotification('MESSAGE_SENT', 'success');
    }
    */
  }

  /**
   * Obtener información adicional del empresario si es necesario
   */
  getBusinessmanDetails(businessmanId: string) {
    return this.requestsWithDetails.find(req => req.businessmanId === businessmanId)?.businessmanProfile;
  }

  /**
   * Formatear fecha para mostrar
   */
  formatDate(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Determinar el estado visual de la solicitud
   */
  getRequestStatus(request: any): string {
    switch (request.status) {
      case 'pending': return 'STATUS_PENDING';
      case 'accepted': return 'STATUS_ACCEPTED';
      case 'rejected': return 'STATUS_REJECTED';
      case 'in_progress': return 'STATUS_IN_PROGRESS';
      case 'completed': return 'STATUS_COMPLETED';
      default: return 'STATUS_PENDING';
    }
  }

  /**
   * Determinar urgencia de la solicitud
   */
  getUrgencyLevel(request: any): string {
    if (!request.urgency) return '';

    switch (request.urgency.toLowerCase()) {
      case 'low': return 'URGENCY_LOW';
      case 'medium': return 'URGENCY_MEDIUM';
      case 'high': return 'URGENCY_HIGH';
      case 'urgent': return 'URGENCY_URGENT';
      default: return request.urgency;
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
