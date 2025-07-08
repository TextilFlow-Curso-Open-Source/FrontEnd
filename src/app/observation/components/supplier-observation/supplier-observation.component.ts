// supplier-observation.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ObservationService } from '../../services/observation.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Observation, OBSERVATION_STATUS } from '../../models/observation.entity';
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
  statusFilter: string | null = null;
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
    if (user && user.id) {
      this.currentSupplierId = user.id;
      this.loadObservations();
    }
  }

  loadObservations(): void {
    this.isLoading = true;

    this.observationService.getBySupplierId(this.currentSupplierId).subscribe({
      next: (observations: Observation[]) => {
        console.log("Todas las observaciones:", observations);
        console.log("ID de proveedor actual:", this.currentSupplierId);

        // Filtrar observaciones del proveedor actual
        this.observations = observations.filter(obs =>
          obs.supplierId.toString() === this.currentSupplierId
        );


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
    if (!observation.id) return;

    // Cambiar estado entre PENDIENTE y VISTO
    const newStatus = observation.status === OBSERVATION_STATUS.PENDIENTE
      ? OBSERVATION_STATUS.VISTO
      : OBSERVATION_STATUS.PENDIENTE;

    const updatedObservation: Observation = {
      ...observation,
      status: newStatus
    };

    this.observationService.update(observation.id, updatedObservation).subscribe({
      next: () => {
        const statusText = newStatus === OBSERVATION_STATUS.VISTO ? 'marcada como vista' : 'marcada como pendiente';
        this.showNotification(`Observación ${statusText}`, 'success');
        this.loadObservations();
      },
      error: (error: any) => {
        console.error('Error al actualizar observación:', error);
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

  // Filtrar por estado
  setStatusFilter(status: string | null): void {
    this.statusFilter = status;
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

  // Iconos para estados
  getStatusIcon(status: string): string {
    switch (status) {
      case OBSERVATION_STATUS.VISTO:
        return 'visibility';
      case OBSERVATION_STATUS.PENDIENTE:
        return 'schedule';
      default:
        return 'help';
    }
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

  // Obtener clase de estado para colorear
  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case OBSERVATION_STATUS.VISTO.toLowerCase():
        return 'status-seen';
      case OBSERVATION_STATUS.PENDIENTE.toLowerCase():
        return 'status-pending';
      default:
        return '';
    }
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

  // Abrir modal de imagen
  openImageModal(imageUrl: string): void {
    window.open(imageUrl, '_blank');
  }
}
