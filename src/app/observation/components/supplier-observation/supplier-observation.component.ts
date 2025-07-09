// supplier-observation.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ObservationService } from '../../services/observation.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Observation, OBSERVATION_STATUS, ObservationStatus } from '../../models/observation.entity';
import { AppInputComponent } from '../../../core/components/app-input/app-input.component';
import { AppButtonComponent } from '../../../core/components/app-button/app-button.component';
import { AppNotificationComponent } from '../../../core/components/app-notification/app-notification.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-supplier-observation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

    AppButtonComponent,
    AppNotificationComponent,
    TranslateModule
  ],
  templateUrl: './supplier-observation.component.html',
  styleUrls: ['./supplier-observation.component.css']
})
export class SupplierObservationComponent implements OnInit {
  // Estados de la vista
  view: 'table' | 'detail' = 'table';

  // Observaciones del proveedor
  observations: Observation[] = [];
  filteredObservations: Observation[] = [];
  selectedObservation: Observation | null = null;

  // Usuario actual (proveedor)
  currentSupplierId: string = '';

  // Búsqueda y filtros
  searchTerm: string = '';
  showQuickFilters: boolean = false;
  statusFilter: ObservationStatus | null = null;
  sortField: string = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Estado de carga
  isLoading: boolean = false;

  // Notificaciones
  notification = {
    show: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'warning' | 'info'
  };

  constructor(
    private observationService: ObservationService,
    private authService: AuthService
  ) {}


  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    console.log('Usuario actual:', user); // Debug
    if (user && user.id) {
      this.currentSupplierId = user.id;
      console.log('Supplier ID:', this.currentSupplierId); // Debug
      this.loadObservations();
    } else {
      console.error('No se pudo obtener el usuario actual');
    }
  }

  loadObservations(): void {
    this.isLoading = true;

    this.observationService.getBySupplierId(this.currentSupplierId).subscribe({
      next: (observations: Observation[]) => {
        console.log("Todas las observaciones:", observations);
        console.log("ID de proveedor actual:", this.currentSupplierId);

        // Filtrar observaciones del proveedor actual

        this.observations = observations.filter(obs => {
          console.log('Comparando:', obs.supplierId.toString(), 'con', this.currentSupplierId);
          return obs.supplierId.toString() === this.currentSupplierId;
        });


        console.log("Observaciones filtradas:", this.observations);
        this.filteredObservations = [...this.observations];
        this.filterObservations();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar observaciones:', error);
        this.showNotification('Error al cargar las observaciones', 'error');
        this.isLoading = false;
      }
    });
  }

  // Toggle estado de observación con un click
  toggleObservationStatus(observation: Observation): void {
    console.log('Intentando cambiar estado de:', observation);

    if (!observation.id) {
      console.error('Observación sin ID:', observation);
      return;
    }

    console.log('Estado actual:', observation.status);

    // Normalizar el estado actual para comparación
    const currentStatus = observation.status?.toUpperCase() || '';
    console.log('Estado normalizado:', currentStatus);

    // Lógica de toggle: PENDIENTE ↔ EN_REVISION (que se muestra como "Visto")
    let newStatus: string;
    if (currentStatus === 'PENDIENTE') {
      newStatus = 'EN_REVISION';  // Backend recibe EN_REVISION
    } else if (currentStatus === 'EN_REVISION') {
      newStatus = 'PENDIENTE';
    } else {
      // Si es otro estado, cambiar a EN_REVISION por defecto
      console.warn('Estado no reconocido:', observation.status, 'cambiando a EN_REVISION');
      newStatus = 'EN_REVISION';
    }

    console.log('Nuevo estado (backend):', newStatus);
    console.log('Se mostrará como:', this.getStatusDisplayLabel(newStatus));

    const updatedObservation: Observation = {
      ...observation,
      status: newStatus as ObservationStatus
    };

    console.log('Enviando actualización:', updatedObservation);

    this.observationService.update(observation.id, updatedObservation).subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response);
        // Mostrar notificación con label amigable
        const statusText = newStatus === 'EN_REVISION' ? 'marcada como vista' : 'marcada como pendiente';
        this.showNotification(`Observación ${statusText}`, 'success');

        this.loadObservations();

        if (this.selectedObservation && this.selectedObservation.id === observation.id) {
          this.selectedObservation = { ...this.selectedObservation, status: newStatus as ObservationStatus };
        }
      },
      error: (error: any) => {
        console.error('Error completo:', error);
        this.showNotification('Error al actualizar el estado', 'error');
      }
    });
  }

  // Limpiar búsqueda
  clearSearch(): void {
    this.searchTerm = '';
    this.filterObservations();
  }

  // Toggle filtros rápidos
  toggleFilters(): void {
    this.showQuickFilters = !this.showQuickFilters;
  }

  // En lugar de usar las constantes del enum viejo, usa strings directamente
  setStatusFilter(status: string | null): void {
    this.statusFilter = status as ObservationStatus;
    this.filterObservations();
  }

  // Filtros que incluyen estado y texto
  filterObservations(): void {
    let filtered = [...this.observations];

    // Filtro por texto
    if (this.searchTerm && this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(obs =>
        (obs.batchCode && obs.batchCode.toLowerCase().includes(search)) ||
        (obs.reason && obs.reason.toLowerCase().includes(search)) ||
        (obs.status && obs.status.toLowerCase().includes(search))
      );
    }

    // Filtro por estado
    if (this.statusFilter) {
      filtered = filtered.filter(obs => obs.status === this.statusFilter);
    }

    // Aplicar ordenamiento
    filtered = this.sortObservations(filtered);

    this.filteredObservations = filtered;
  }

  // Ordenamiento
  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.filterObservations();
  }

  // Método de ordenamiento
  private sortObservations(observations: Observation[]): Observation[] {
    return observations.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (this.sortField) {
        case 'batchCode':
          valueA = a.batchCode || '';
          valueB = b.batchCode || '';
          break;
        case 'status':
          valueA = a.status || '';
          valueB = b.status || '';
          break;
        case 'createdAt':
          valueA = new Date(a.createdAt);
          valueB = new Date(b.createdAt);
          break;
        default:
          return 0;
      }

      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  // TrackBy para mejor performance
  trackByObservationId(index: number, observation: Observation): string {
    return observation.id || index.toString();
  }

  // Verificar si una observación es reciente (menos de 24 horas)
  isRecentObservation(observation: Observation): boolean {
    const obsDate = new Date(observation.createdAt);
    const now = new Date();
    const hoursDiff = Math.floor((now.getTime() - obsDate.getTime()) / (1000 * 60 * 60));
    return hoursDiff < 24;
  }



  // Vista de detalles
  viewObservationDetails(observation: Observation): void {
    this.selectedObservation = observation;
    this.view = 'detail';
  }

  // Volver a la tabla
  backToTable(): void {
    this.view = 'table';
    this.selectedObservation = null;
  }

  // Método auxiliar para mostrar notificaciones
  showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.notification = {
      show: true,
      message,
      type
    };
  }



  // Formatear fecha
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  // Método para obtener el label del botón de toggle
  getToggleButtonLabel(status: string): string {
    const normalizedStatus = status?.toUpperCase() || '';
    if (normalizedStatus === 'PENDIENTE') {
      return 'OBSERVATION_SUPPLIER.MARK_AS_SEEN'; // "Marcar como vista"
    } else if (normalizedStatus === 'EN_REVISION') {
      return 'OBSERVATION_SUPPLIER.MARK_AS_PENDING'; // "Marcar como pendiente"
    } else {
      return 'OBSERVATION_SUPPLIER.MARK_AS_SEEN'; // Por defecto
    }
  }

// Método para obtener el ícono del botón de toggle
  getToggleButtonIcon(status: string): string {
    const normalizedStatus = status?.toUpperCase() || '';
    if (normalizedStatus === 'PENDIENTE') {
      return 'visibility'; // Ícono para marcar como vista
    } else if (normalizedStatus === 'EN_REVISION') {
      return 'schedule'; // Ícono para marcar como pendiente
    } else {
      return 'visibility'; // Por defecto
    }
  }
  // Agregar estos métodos a tu componente

// Mapea el estado del backend a un label amigable para mostrar
  getStatusDisplayLabel(status: string): string {
    const normalizedStatus = status?.toUpperCase() || '';
    switch (normalizedStatus) {
      case 'PENDIENTE':
        return 'Pendiente';
      case 'EN_REVISION':
        return 'Visto';  // ← Mostramos "Visto" pero internamente es "EN_REVISION"
      case 'RESUELTA':
        return 'Resuelta';
      case 'RECHAZADA':
        return 'Rechazada';
      default:
        return status;
    }
  }

// Mapea el estado del backend a clases CSS
  getStatusClass(status: string): string {
    const normalizedStatus = status?.toUpperCase() || '';
    switch (normalizedStatus) {
      case 'EN_REVISION':
        return 'status-seen';    // ← Usamos la clase de "visto"
      case 'PENDIENTE':
        return 'status-pending';
      case 'RESUELTA':
        return 'status-resolved';
      case 'RECHAZADA':
        return 'status-rejected';
      default:
        return '';
    }
  }

// Mapea el estado del backend a iconos
  getStatusIcon(status: string): string {
    const normalizedStatus = status?.toUpperCase() || '';
    switch (normalizedStatus) {
      case 'EN_REVISION':
        return 'visibility';     // ← Icono de "visto"
      case 'PENDIENTE':
        return 'schedule';
      case 'RESUELTA':
        return 'check_circle';
      case 'RECHAZADA':
        return 'cancel';
      default:
        return 'help';
    }
  }




  // Abrir modal de imagen
  openImageModal(imageUrl: string): void {
    window.open(imageUrl, '_blank');
  }

  protected readonly OBSERVATION_STATUS = OBSERVATION_STATUS;
}
