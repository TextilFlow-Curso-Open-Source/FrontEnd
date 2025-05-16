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

@Component({
  selector: 'app-businessman-batch',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AppInputComponent,
    AppButtonComponent,
    AppNotificationComponent
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

  // Usuario actual
  currentUserId: number = 0;

  // Búsqueda
  searchTerm: string = '';

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
      error: (error) => {
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
    }
  }

  loadBatches(): void {
    this.isLoading = true;

    this.batchService.getAll().subscribe({
      next: (batches: Batch[]) => {
        console.log("Todos los lotes:", batches);
        console.log("ID de usuario actual:", this.currentUserId);

        // Filtrar lotes del usuario actual o sin businessmanId (posiblemente lotes actualizados)
        this.batches = batches.filter(batch => {
          // Si no tiene businessmanId, verificar si tiene algún otro indicio de que pertenece al usuario
          if (!batch.businessmanId) {
            // Por ejemplo, si el cliente coincide con el nombre del usuario actual
            const user = this.authService.getCurrentUser();
            if (user && user.name && batch.client === user.name) {
              return true;
            }
            // Opcional: también podríamos verificar supplierId si tenemos esa relación
            return false;
          }

          return batch.businessmanId === this.currentUserId;
        });

        console.log("Lotes filtrados:", this.batches);
        this.filteredBatches = [...this.batches];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar lotes:', error);
        this.showNotification('Error al cargar los lotes', 'error');
        this.isLoading = false;
      }
    });
  }

  // Manejo de filtros y búsqueda
  filterBatches(): void {
    if (!this.searchTerm.trim()) {
      this.filteredBatches = [...this.batches];
      return;
    }

    const search = this.searchTerm.toLowerCase().trim();
    this.filteredBatches = this.batches.filter(batch =>
      batch.code.toLowerCase().includes(search) ||
      batch.client.toLowerCase().includes(search) ||
      batch.fabricType.toLowerCase().includes(search) ||
      batch.color.toLowerCase().includes(search) ||
      batch.status.toLowerCase().includes(search)
    );
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
      error: (error) => {
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
    if (file && file.type.match(/image\/*/) && file.size < 5000000) { // < 5MB
      this.selectedFile = file;
      this.readAndCompressImage(file);
    } else {
      this.showNotification('Por favor seleccione una imagen válida (máx. 5MB)', 'warning');
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
      error: (error) => {
        console.error('Error al rechazar lote:', error);
        this.showNotification('Error al rechazar el lote', 'error');
        this.isLoading = false;
      }
    });
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
    return batch.status === STATUS.ENVIADO;
  }

  triggerFileInput(): void {
    document.getElementById('rejectImage')?.click();
  }

}
