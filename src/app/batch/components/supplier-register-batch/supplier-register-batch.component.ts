// supplier-register-batch.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { BatchService } from '../../services/batch.service.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Batch, STATUS, BatchStatus } from '../../models/batch.entity';

import { AppInputComponent } from '../../../core/components/app-input/app-input.component';
import { AppButtonComponent } from '../../../core/components/app-button/app-button.component';
import { AppNotificationComponent } from '../../../core/components/app-notification/app-notification.component';
import { MatIconModule } from '@angular/material/icon';
import {TranslateModule} from '@ngx-translate/core';

@Component({
  selector: 'app-supplier-register-batch',
  standalone: true,
  templateUrl: './supplier-register-batch.component.html',
  styleUrls: ['./supplier-register-batch.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppInputComponent,
    AppButtonComponent,
    AppNotificationComponent,
    MatIconModule,
    TranslateModule
  ]
})
export class SupplierRegisterBatchComponent implements OnInit {
  form!: FormGroup;

  // Control de pestañas
  activeTab: 'pending' | 'register' = 'pending';

  // Lotes pendientes
  pendingBatches: Batch[] = [];
  selectedBatch: Batch | null = null;
  isLoading: boolean = false;

  // Notificación
  notification = {
    show: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'warning' | 'info'
  };

  // Estados disponibles para el selector (excluyendo PENDIENTE y COMPLETADO)
  availableStatuses = [
    { label: 'Aceptado', value: STATUS.ACEPTADO },
    { label: 'Rechazado', value: STATUS.RECHAZADO },
    { label: 'Por Enviar', value: STATUS.POR_ENVIAR },
    { label: 'Enviado', value: STATUS.ENVIADO }
  ];

  // Variables para la carga de imágenes
  selectedImage: File | null = null;
  imagePreview: string = '';

  // Usuario actual
  currentUserId: string = '';

  constructor(
    private fb: FormBuilder,
    private batchService: BatchService,
    private authService: AuthService,
    private router: Router
  ) {
    const user = this.authService.getCurrentUser();
    if (user && user.id) {
      this.currentUserId = user.id;
    }
  }

  ngOnInit(): void {
    this.initForm();
    this.loadPendingBatches();
  }

  initForm(): void {
    this.form = this.fb.group({
      code: [{value: '', disabled: true}, Validators.required],
      client: [{value: '', disabled: true}, Validators.required],
      fabricType: [{value: '', disabled: true}, Validators.required],
      color: [{value: '', disabled: true}, Validators.required],
      quantity: [{value: 0, disabled: true}, [Validators.required, Validators.min(1)]],
      price: [{value: 0, disabled: true}, [Validators.required, Validators.min(0)]],
      observations: [{value: '', disabled: true}],
      address: [{value: '', disabled: true}],
      date: [{value: new Date().toISOString().slice(0, 10), disabled: true}, Validators.required],
      status: [null, Validators.required], // Campo para seleccionar el estado
      imageUrl: [''], // Subida de imágenes
      additionalComments: [''] // Comentarios adicionales del proveedor
    });
  }

  loadPendingBatches(): void {
    this.isLoading = true;
    console.log('SupplierRegisterBatch - Current User ID:', this.currentUserId);

    // Usar getBySupplierId en lugar de getBatchesBySupplier que no existe
    this.batchService.getBySupplierId(this.currentUserId).subscribe({
      next: (batches: Batch[]) => {
        console.log('SupplierRegisterBatch - All batches for supplier:', batches);
        
        // Filtrar solo los lotes que pertenecen al supplier actual
        this.pendingBatches = batches.filter(batch => batch.supplierId === this.currentUserId);
        
        console.log('STATUS.PENDIENTE:', STATUS.PENDIENTE);
        console.log('STATUS.POR_ENVIAR:', STATUS.POR_ENVIAR);
        console.log('Lotes filtrados para el supplier:', this.pendingBatches);

        // Log individual de cada batch
        batches.forEach(batch => {
          console.log(`Batch ${batch.id}: status='${batch.status}', supplierId='${batch.supplierId}'`);
          console.log('Status comparison:', batch.status === STATUS.PENDIENTE, batch.status === STATUS.POR_ENVIAR);
        });
        console.log('SupplierRegisterBatch - Filtered pending batches:', this.pendingBatches);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar lotes pendientes:', error);
        this.showNotification('Error al cargar los lotes pendientes', 'error');
        this.isLoading = false;
      }
    });
  }

  selectBatch(batch: Batch): void {
    this.selectedBatch = batch;
    this.clearImageData();

    // Cambiar a la pestaña de registro
    this.activeTab = 'register';

    // Llenar el formulario con los datos del lote seleccionado
    this.form.patchValue({
      code: batch.code,
      client: batch.client,
      fabricType: batch.fabricType,
      color: batch.color,
      quantity: batch.quantity,
      price: batch.price,
      observations: batch.observations || '',
      address: batch.address || '',
      date: batch.date,
      status: batch.status,
      imageUrl: batch.imageUrl || '',
      additionalComments: ''
    });

    // Si el batch ya tiene imagen, mostrarla
    if (batch.imageUrl) {
      this.imagePreview = batch.imageUrl;
    }
  }

  setActiveTab(tab: 'pending' | 'register'): void {
    this.activeTab = tab;
    if (tab === 'pending') {
      this.selectedBatch = null;
      this.clearImageData();
      this.form.reset();
      this.initForm();
    }
  }

  private clearImageData(): void {
    this.imagePreview = '';
    this.selectedImage = null;
    // Limpiar input de archivo si existe
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // Método para obtener el icono según el estado
  getStatusIcon(status: string): string {
    switch (status) {
      case STATUS.PENDIENTE:
        return 'pending';
      case STATUS.ACEPTADO:
        return 'check_circle';
      case STATUS.RECHAZADO:
        return 'cancel';
      case STATUS.POR_ENVIAR:
        return 'schedule_send';
      case STATUS.ENVIADO:
        return 'local_shipping';
      default:
        return 'help_outline';
    }
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo y tamaño de archivo
    if (!file.type.startsWith('image/')) {
      this.showNotification('Por favor seleccione un archivo de imagen válido', 'warning');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB máximo
      this.showNotification('La imagen no puede superar los 5MB', 'warning');
      return;
    }

    this.selectedImage = file;

    // Crear vista previa
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.onerror = () => {
      this.showNotification('Error al cargar la imagen', 'error');
    };
    reader.readAsDataURL(file);

    this.form.get('imageUrl')?.setValue(file.name);
  }



  onSubmit(): void {
    if (!this.selectedBatch) {
      this.showNotification('Debe seleccionar un lote pendiente primero', 'warning');
      return;
    }

    if (this.form.invalid) {
      this.showNotification('Por favor complete todos los campos requeridos', 'warning');
      this.markFormGroupTouched();
      return;
    }

    // Verificar que se haya seleccionado un estado
    const newStatus = this.form.get('status')?.value as BatchStatus | null;
    if (!newStatus) {
      this.showNotification('Por favor seleccione un estado para el lote', 'warning');
      return;
    }

    this.isLoading = true;
    this.updateBatch(newStatus);
  }

  updateBatch(newStatus: BatchStatus, imageData?: string): void {
    if (!this.selectedBatch) return;

    // Solo enviar los campos que se pueden actualizar
    const updatedBatch: Partial<Batch> = {
      status: newStatus,
      observations: this.form.get('additionalComments')?.value || this.selectedBatch.observations
    };

    // Actualizar primero el batch sin la imagen
    this.batchService.updateBatch(this.selectedBatch.id as string, updatedBatch).subscribe({
      next: () => {
        // Si hay imagen, subirla por separado
        if (imageData && this.selectedImage) {
          this.uploadImage();
        } else {
          this.showNotification(`Lote actualizado y marcado como ${newStatus} correctamente`, 'success');
          this.loadPendingBatches();
          this.setActiveTab('pending');
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error al actualizar el lote:', error);
        this.showNotification('Error al actualizar el lote', 'error');
        this.isLoading = false;
      }
    });
  }

  private uploadImage(): void {
    if (!this.selectedBatch || !this.selectedImage) return;

    this.batchService.uploadBatchImage(this.selectedBatch.id as string, this.selectedImage).subscribe({
      next: () => {
        this.showNotification('Lote e imagen actualizados correctamente', 'success');
        this.loadPendingBatches();
        this.setActiveTab('pending');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al subir la imagen:', error);
        this.showNotification('Lote actualizado pero error al subir imagen', 'warning');
        this.loadPendingBatches();
        this.setActiveTab('pending');
        this.isLoading = false;
      }
    });
  }

  onCancel(): void {
    this.setActiveTab('pending');
    this.form.reset();
    this.initForm();
  }

  // Método auxiliar para marcar todos los campos como tocados (para mostrar errores)
  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });
  }

  showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.notification = {
      show: true,
      message,
      type
    };
  }
}
