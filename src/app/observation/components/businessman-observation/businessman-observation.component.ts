// businessman-observation.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ObservationService } from '../../services/observation.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Observation, OBSERVATION_STATUS, ObservationStatus } from '../../models/observation.entity';
import { AppInputComponent } from '../../../core/components/app-input/app-input.component';
import { AppButtonComponent } from '../../../core/components/app-button/app-button.component';
import { AppNotificationComponent } from '../../../core/components/app-notification/app-notification.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-businessman-observation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AppButtonComponent,
    AppNotificationComponent,
    TranslateModule
  ],
  templateUrl: './businessman-observation.component.html',
  styleUrls: ['./businessman-observation.component.css']
})
export class BusinessmanObservationComponent implements OnInit {
  // Estados de la vista
  view: 'table' | 'detail' = 'table';

  // Observaciones del usuario
  observations: Observation[] = [];
  filteredObservations: Observation[] = [];
  selectedObservation: Observation | null = null;
  selectedObservations: Set<string> = new Set();

  // Usuario actual
  currentUserId: string = '';

  // Búsqueda y filtros
  searchTerm: string = '';
  showQuickFilters: boolean = false;
  statusFilter: ObservationStatus | null = null;
  sortField: string = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Estado de carga
  isLoading: boolean = false;
  isDeleting: boolean = false;

  // Notificaciones
  notification = {
    show: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'warning' | 'info'
  };

  // Constantes para estados
  readonly OBSERVATION_STATUS = OBSERVATION_STATUS;

  constructor(
    private observationService: ObservationService,
    private authService: AuthService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.id) {
      this.currentUserId = user.id;
      this.loadObservations();
    }
  }

  loadObservations(): void {
    this.isLoading = true;

    this.observationService.getAll().subscribe({
      next: (observations: Observation[]) => {
        console.log("Todas las observaciones:", observations);
        console.log("ID de usuario actual:", this.currentUserId);

        // Filtrar observaciones del usuario actual
        this.observations = observations.filter(obs =>
          obs.businessmanId === this.currentUserId
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
  setStatusFilter(status: ObservationStatus | null): void {
    this.statusFilter = status;
    this.filterObservations();
  }

  // Filtros que incluyen búsqueda y estado
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
        case 'createdAt':
          valueA = new Date(a.createdAt);
          valueB = new Date(b.createdAt);
          break;
        case 'status':
          valueA = a.status || '';
          valueB = b.status || '';
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

  // Selección de observaciones
  toggleObservationSelection(observation: Observation): void {
    if (!observation.id) return;

    if (this.selectedObservations.has(observation.id)) {
      this.selectedObservations.delete(observation.id);
    } else {
      this.selectedObservations.add(observation.id);
    }
  }

  // Seleccionar todas las observaciones visibles
  toggleSelectAll(): void {
    const allSelected = this.filteredObservations.every(obs =>
      obs.id && this.selectedObservations.has(obs.id)
    );

    if (allSelected) {
      // Deseleccionar todas
      this.filteredObservations.forEach(obs => {
        if (obs.id) this.selectedObservations.delete(obs.id);
      });
    } else {
      // Seleccionar todas
      this.filteredObservations.forEach(obs => {
        if (obs.id) this.selectedObservations.add(obs.id);
      });
    }
  }

  // Verificar si todas están seleccionadas
  get allSelected(): boolean {
    return this.filteredObservations.length > 0 &&
      this.filteredObservations.every(obs =>
        obs.id && this.selectedObservations.has(obs.id)
      );
  }

  // Verificar si alguna está seleccionada
  get someSelected(): boolean {
    return this.selectedObservations.size > 0;
  }

  // Iconos para estados
  getStatusIcon(status: string): string {
    switch (status) {
      case OBSERVATION_STATUS.PENDIENTE:
        return 'schedule';
      case OBSERVATION_STATUS.VISTO:
        return 'visibility';
      default:
        return 'help';
    }
  }

  // Clase CSS para estados
  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case OBSERVATION_STATUS.PENDIENTE.toLowerCase():
        return 'status-pending';
      case OBSERVATION_STATUS.VISTO.toLowerCase():
        return 'status-viewed';
      default:
        return '';
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

  // Eliminar observaciones seleccionadas
  deleteSelectedObservations(): void {
    if (this.selectedObservations.size === 0) return;

    const count = this.selectedObservations.size;
    const message = count === 1
      ? '¿Está seguro de eliminar esta observación?'
      : `¿Está seguro de eliminar ${count} observaciones?`;

    if (confirm(message)) {
      this.performDelete();
    }
  }

  // Eliminar una observación específica
  deleteObservation(observation: Observation): void {
    if (!observation.id) return;

    if (confirm(`¿Está seguro de eliminar la observación del lote ${observation.batchCode}?`)) {
      this.selectedObservations.clear();
      this.selectedObservations.add(observation.id);
      this.performDelete();
    }
  }

  // Realizar eliminación
  private performDelete(): void {
    this.isDeleting = true;
    const idsToDelete = Array.from(this.selectedObservations);
    let deletedCount = 0;
    let errorCount = 0;

    idsToDelete.forEach(id => {
      this.observationService.delete(id).subscribe({
        next: () => {
          deletedCount++;
          this.checkDeleteCompletion(deletedCount, errorCount, idsToDelete.length);
        },
        error: (error: any) => {
          console.error('Error al eliminar observación:', error);
          errorCount++;
          this.checkDeleteCompletion(deletedCount, errorCount, idsToDelete.length);
        }
      });
    });
  }

  // Verificar completitud de eliminación
  private checkDeleteCompletion(deletedCount: number, errorCount: number, totalCount: number): void {
    if (deletedCount + errorCount === totalCount) {
      this.isDeleting = false;
      this.selectedObservations.clear();

      if (deletedCount > 0) {
        const message = deletedCount === 1
          ? 'Observación eliminada correctamente'
          : `${deletedCount} observaciones eliminadas correctamente`;
        this.showNotification(message, 'success');
        this.loadObservations();
      }

      if (errorCount > 0) {
        const message = errorCount === 1
          ? 'Error al eliminar una observación'
          : `Error al eliminar ${errorCount} observaciones`;
        this.showNotification(message, 'error');
      }
    }
  }

  // Abrir modal de imagen
  openImageModal(imageUrl: string): void {
    window.open(imageUrl, '_blank');
  }

  // Método auxiliar para mostrar notificaciones
  showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.notification = {
      show: true,
      message,
      type
    };
  }

  // Verificar si una observación está seleccionada
  isObservationSelected(observation: Observation): boolean {
    return observation.id ? this.selectedObservations.has(observation.id) : false;
  }

  // Obtener texto del estado en el idioma actual
  getStatusText(status: string): string {
    switch (status) {
      case OBSERVATION_STATUS.PENDIENTE:
        return this.translateService.instant('OBSERVATION.STATUS_PENDING');
      case OBSERVATION_STATUS.VISTO:
        return this.translateService.instant('OBSERVATION.STATUS_VIEWED');
      default:
        return status;
    }
  }

  // Verificar si es una observación reciente (menos de 24 horas)
  isRecentObservation(observation: Observation): boolean {
    const createdDate = new Date(observation.createdAt);
    const now = new Date();
    const hoursDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60));
    return hoursDiff < 24;
  }
}
