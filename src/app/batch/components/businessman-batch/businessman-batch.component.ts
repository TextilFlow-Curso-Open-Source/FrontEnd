// businessman-batch.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BatchService} from '../../services/batch.service.service';
import { AuthService} from '../../../auth/services/auth.service';
import { Batch, STATUS, BatchStatus } from '../../models/batch.entity';
import { AppInputComponent} from '../../../core/components/app-input/app-input.component';
import { AppButtonComponent} from '../../../core/components/app-button/app-button.component';
import { AppNotificationComponent} from '../../../core/components/app-notification/app-notification.component';
import { Observation, OBSERVATION_STATUS  } from '../../../observation/models/observation.entity';
import { ObservationService} from '../../../observation/services/observation.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {SupplierService} from '../../../supplier/services/supplier.service';
import {Supplier} from '../../../supplier/models/supplier.entity';

@Component({
  selector: 'app-businessman-batch',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AppInputComponent,
    AppButtonComponent,
    AppNotificationComponent,
    TranslateModule
  ],
  templateUrl: './businessman-batch.component.html',
  styleUrls: ['./businessman-batch.component.css']
})
export class BusinessmanBatchComponent implements OnInit {
  // Estados de la vista
  view: 'table' | 'detail' | 'reject' = 'table';

  // Lotes del usuario
  batches: Batch[] = [];
  filteredBatches: Batch[] = [];
  selectedBatch: Batch | null = null;
  isCreatingObservation: boolean = false;
  suppliers: Supplier[] = [];
  // Usuario actual
  currentUserId: string = '';

  // Búsqueda y filtros
  searchTerm: string = '';
  showQuickFilters: boolean = false;
  statusFilter: string | null = null;
  sortField: string = 'date';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Estado de carga
  isLoading: boolean = false;

  // Notificaciones
  notification = {
    show: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'warning' | 'info'
  };

  // Para el formulario de rechazo
  rejectReason: string = '';
  rejectImage: string = ''; // Base64
  selectedFile: File | null = null;

  constructor(
    private batchService: BatchService,
    private authService: AuthService,
    private observationService: ObservationService,
    private supplierService: SupplierService
  ) {}

  createBatchObservation(batch: Batch): void {
    // Si ya está en proceso de crear una observación, no hacer nada
    if (this.isCreatingObservation) return;

    this.isCreatingObservation = true;

    const now = new Date().toISOString();

    const observation: Observation = new Observation({
      batchId: batch.id!,
      batchCode: batch.code,
      businessmanId: this.currentUserId,
      supplierId: batch.supplierId,
      reason: this.rejectReason,
      imageUrl: this.rejectImage || batch.imageUrl,
      status: OBSERVATION_STATUS.PENDIENTE,
      createdAt: now
    });

    this.observationService.create(observation).subscribe({
      next: () => {
        console.log('Registro de observación creado correctamente');
        this.isCreatingObservation = false;
      },
      error: (error: any) => {
        console.error('Error al crear registro de observación:', error);
        this.isCreatingObservation = false;
      }
    });
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.id) {
      this.currentUserId = user.id;
      this.loadBatches();
      this.loadSuppliers()
    }
  }
  getSupplierCompanyName(supplierId: string): string {
    const supplier = this.suppliers.find(s => s.id === supplierId);
    return supplier?.companyName || 'Empresa no encontrada';
  }
  loadSuppliers(): void {
    this.supplierService.getAllSuppliers().subscribe({
      next: (suppliers) => {
        this.suppliers = suppliers;
        console.log('Proveedores cargados:', suppliers);
      },
      error: (error) => {
        console.error('Error al cargar proveedores:', error);
      }
    });
  }
  loadBatches(): void {
    this.isLoading = true;

    this.batchService.getAll().subscribe({
      next: (batches: Batch[]) => {
        console.log("Todos los lotes:", batches);
        console.log("ID de usuario actual:", this.currentUserId);

        // Filtrar lotes del usuario actual o sin businessmanId
        this.batches = batches.filter(batch => {
          if (!batch.businessmanId) {
            const user = this.authService.getCurrentUser();
            if (user && user.name && batch.client === user.name) {
              return true;
            }
            return false;
          }
          return batch.businessmanId === this.currentUserId;
        });

        console.log("Lotes filtrados:", this.batches);
        this.filteredBatches = [...this.batches];
        this.filterBatches();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar lotes:', error);
        this.showNotification('Error al cargar los lotes', 'error');
        this.isLoading = false;
      }
    });
  }

  // Limpiar búsqueda
  clearSearch(): void {
    this.searchTerm = '';
    this.filterBatches();
  }

  // Toggle filtros rápidos
  toggleFilters(): void {
    this.showQuickFilters = !this.showQuickFilters;
  }

  // Filtrar por estado
  setStatusFilter(status: string | null): void {
    this.statusFilter = status;
    this.filterBatches();
  }

  // Filtros mejorados que incluyen estado
  filterBatches(): void {
    let filtered = [...this.batches];

    // Filtro por texto
    if (this.searchTerm && this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(batch =>
        (batch.code && batch.code.toLowerCase().includes(search)) ||
        (batch.client && batch.client.toLowerCase().includes(search)) ||
        (batch.fabricType && batch.fabricType.toLowerCase().includes(search)) ||
        (batch.color && batch.color.toLowerCase().includes(search)) ||
        (batch.status && batch.status.toLowerCase().includes(search))
      );
    }

    // Filtro por estado
    if (this.statusFilter) {
      filtered = filtered.filter(batch => batch.status === this.statusFilter);
    }

    // Aplicar ordenamiento
    filtered = this.sortBatches(filtered);

    this.filteredBatches = filtered;
  }

  // Ordenamiento
  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.filterBatches();
  }

  // Método de ordenamiento
  private sortBatches(batches: Batch[]): Batch[] {
    return batches.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (this.sortField) {
        case 'code':
          valueA = a.code || '';
          valueB = b.code || '';
          break;
        case 'client':
          valueA = a.client || '';
          valueB = b.client || '';
          break;
        case 'date':
          valueA = new Date(a.date);
          valueB = new Date(b.date);
          break;
        case 'price':
          valueA = a.price || 0;
          valueB = b.price || 0;
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
  trackByBatchId(index: number, batch: Batch): string {
    return batch.id || index.toString();
  }

  // Verificar si un lote es urgente (más de 7 días sin acción)
  isUrgentBatch(batch: Batch): boolean {
    if (batch.status !== STATUS.ACEPTADO) return false;

    const batchDate = new Date(batch.date);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - batchDate.getTime()) / (1000 * 60 * 60 * 24));

    return daysDiff > 7;
  }

  // Iconos para estados
  getStatusIcon(status: string): string {
    switch (status) {
      case STATUS.ACEPTADO:
        return 'check_circle';
      case STATUS.ENVIADO:
        return 'local_shipping';
      case STATUS.POR_ENVIAR:
        return 'schedule';
      case STATUS.RECHAZADO:
        return 'cancel';
      case STATUS.COMPLETADO:
        return 'task_alt';
      default:
        return 'help';
    }
  }

  // Vista de detalles
  viewBatchDetails(batch: Batch): void {
    this.selectedBatch = batch;
    this.view = 'detail';
  }

  // Volver a la tabla
  backToTable(): void {
    this.view = 'table';
    this.selectedBatch = null;
  }

  // Aprobación rápida desde tabla
  quickApprove(batch: Batch): void {
    if (!this.canApproveOrReject(batch)) return;

    // Confirmación rápida
    if (confirm(`¿Aprobar el lote ${batch.code}?`)) {
      this.selectedBatch = batch;
      this.approveBatch();
    }
  }

  // Rechazo rápido desde tabla
  quickReject(batch: Batch): void {
    if (!this.canApproveOrReject(batch)) return;

    this.selectedBatch = batch;
    this.showRejectForm();
  }

  // Aprobar lote
  approveBatch(): void {
    if (!this.selectedBatch) return;

    this.isLoading = true;

    // Clonamos el objeto completo para no perder datos
    const updatedBatch: Batch = {...this.selectedBatch};
    // Cambiamos a COMPLETADO, no a ACEPTADO
    updatedBatch.status = STATUS.COMPLETADO;

    this.batchService.update(this.selectedBatch.id!, updatedBatch).subscribe({
      next: () => {
        this.showNotification('Lote aprobado correctamente', 'success');
        this.loadBatches();
        this.backToTable();
      },
      error: (error: any) => {
        console.error('Error al aprobar lote:', error);
        this.showNotification('Error al aprobar el lote', 'error');
        this.isLoading = false;
      }
    });
  }

  // Mostrar formulario de rechazo
  showRejectForm(): void {
    this.rejectReason = '';
    this.rejectImage = '';
    this.selectedFile = null;
    this.view = 'reject';
  }

  // Manejar carga de imagen
  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.handleFileSelection(file);
    }
  }

  // Método mejorado para manejar archivos
  private handleFileSelection(file: File): void {
    if (file && file.type.match(/image\/*/) && file.size < 5000000) {
      this.selectedFile = file;
      this.readAndCompressImage(file);
    } else {
      if (!file.type.match(/image\/*/)) {
        this.showNotification('Por favor seleccione solo archivos de imagen', 'warning');
      } else if (file.size >= 5000000) {
        this.showNotification('La imagen debe ser menor a 5MB', 'warning');
      }
    }
  }

  // Leer y comprimir imagen
  readAndCompressImage(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.src = e.target.result;

      img.onload = () => {
        // Comprimir imagen
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calcular dimensiones para mantener proporción
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Comprimir a JPEG con calidad 0.7 (70%)
          this.rejectImage = canvas.toDataURL('image/jpeg', 0.7);
        }
      };
    };
    reader.readAsDataURL(file);
  }

  // Mejorar el drag & drop
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const uploadArea = event.currentTarget as HTMLElement;
    uploadArea.classList.add('drag-over');
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const uploadArea = event.currentTarget as HTMLElement;
    uploadArea.classList.remove('drag-over');
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const uploadArea = event.currentTarget as HTMLElement;
    uploadArea.classList.remove('drag-over');

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      this.handleFileSelection(file);
    }
  }

  // Remover imagen
  removeImage(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.rejectImage = '';
    this.selectedFile = null;
  }

  // Enviar rechazo
  submitReject(): void {
    if (!this.selectedBatch) return;

    if (!this.rejectReason.trim()) {
      this.showNotification('Por favor ingrese el motivo del rechazo', 'warning');
      return;
    }

    this.isLoading = true;

    // Clonamos el objeto completo para mantener todos los datos
    const updatedBatch: Batch = {...this.selectedBatch};
    updatedBatch.status = STATUS.RECHAZADO;
    updatedBatch.observations = this.rejectReason;
    updatedBatch.imageUrl = this.rejectImage || this.selectedBatch.imageUrl;

    // Ahora también creamos un registro de observación
    this.createBatchObservation(updatedBatch);

    this.batchService.update(this.selectedBatch.id!, updatedBatch).subscribe({
      next: () => {
        this.showNotification('Lote rechazado correctamente', 'success');
        this.loadBatches();
        this.backToTable();
      },
      error: (error: any) => {
        console.error('Error al rechazar lote:', error);
        this.showNotification('Error al rechazar el lote', 'error');
        this.isLoading = false;
      }
    });
  }

  // Abrir modal de imagen
  openImageModal(imageUrl: string): void {
    // Implementar modal de imagen o usar una librería de lightbox
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

  // Obtener clase de estado para colorear
  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case STATUS.ACEPTADO.toLowerCase():
        return 'status-approved';
      case STATUS.ENVIADO.toLowerCase():
        return 'status-sent';
      case STATUS.POR_ENVIAR.toLowerCase():
        return 'status-pending';
      case STATUS.RECHAZADO.toLowerCase():
        return 'status-rejected';
      case STATUS.COMPLETADO.toLowerCase():
        return 'status-completed';
      default:
        return '';
    }
  }

  // Comprobar si un lote se puede aprobar/rechazar
  canApproveOrReject(batch: Batch): boolean {
    return batch.status === STATUS.ACEPTADO;
  }

  triggerFileInput(): void {
    document.getElementById('rejectImage')?.click();
  }
}
