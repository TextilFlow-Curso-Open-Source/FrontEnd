// supplier-register-batch.component.ts - VERSIÓN COMPLETAMENTE CORREGIDA

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
import { TranslateModule } from '@ngx-translate/core';

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
    { label: 'Aceptado', value: 'ACEPTADO' },
    { label: 'Rechazado', value: 'RECHAZADO' },
    { label: 'Por Enviar', value: 'POR_ENVIAR' },
    { label: 'Enviado', value: 'ENVIADO' }
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

    // ✅ DEBUGGING: Monitorear cambios en el campo status
    this.form.get('status')?.valueChanges.subscribe(value => {
      console.log('🔍 Status field changed to:', value, typeof value);
      if (value && typeof value === 'object') {
        console.log('⚠️ Status is an object, should be string:', value);
      }
    });
  }

  initForm(): void {
    this.form = this.fb.group({
      code: [{ value: '', disabled: true }, Validators.required],
      client: [{ value: '', disabled: true }, Validators.required],
      fabricType: [{ value: '', disabled: true }, Validators.required],
      color: [{ value: '', disabled: true }, Validators.required],
      quantity: [{ value: 0, disabled: true }, [Validators.required, Validators.min(1)]],
      price: [{ value: 0, disabled: true }, [Validators.required, Validators.min(0)]],
      observations: [{ value: '', disabled: true }],
      address: [{ value: '', disabled: true }],
      date: [{ value: new Date().toISOString().slice(0, 10), disabled: true }, Validators.required],
      status: [null, Validators.required],
      imageUrl: [''],
      additionalComments: ['']
    });
  }

  loadPendingBatches(): void {
    this.isLoading = true;
    console.log('SupplierRegisterBatch - Current User ID:', this.currentUserId);

    this.batchService.getBySupplierId(this.currentUserId).subscribe({
      next: (batches: Batch[]) => {
        console.log('SupplierRegisterBatch - All batches for supplier:', batches);
        this.pendingBatches = batches.filter(batch => batch.supplierId === this.currentUserId);

        batches.forEach(batch => {
          console.log(`Batch ${batch.id}: status='${batch.status}', supplierId='${batch.supplierId}'`);
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
    this.activeTab = 'register';

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
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

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

    if (!file.type.startsWith('image/')) {
      this.showNotification('Por favor seleccione un archivo de imagen válido', 'warning');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.showNotification('La imagen no puede superar los 5MB', 'warning');
      return;
    }

    this.selectedImage = file;

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

  // ✅ MÉTODO PARA VALIDAR Y LIMPIAR EL ESTADO SELECCIONADO
  private getCleanStatus(statusValue: any): BatchStatus {
    console.log('🔍 Status received from form:', statusValue, typeof statusValue);

    // Si es un objeto con value, extraer el value
    if (statusValue && typeof statusValue === 'object' && statusValue.value) {
      console.log('📋 Extracting value from object:', statusValue.value);
      return statusValue.value as BatchStatus;
    }

    // Si es un string directo, usarlo
    if (typeof statusValue === 'string') {
      console.log('📋 Using string value:', statusValue);
      return statusValue as BatchStatus;
    }

    // Fallback a PENDIENTE si no se puede determinar
    console.warn('⚠️ Could not determine status, using PENDIENTE as fallback');
    return 'PENDIENTE' as BatchStatus;
  }

  // ✅ MÉTODO onSubmit MEJORADO
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

    // ✅ LIMPIAR Y VALIDAR EL ESTADO SELECCIONADO
    const rawStatus = this.form.get('status')?.value;
    const cleanStatus = this.getCleanStatus(rawStatus);

    console.log('🔍 Status validation:');
    console.log('   Raw status from form:', rawStatus);
    console.log('   Cleaned status:', cleanStatus);

    if (!cleanStatus || cleanStatus === 'PENDIENTE') {
      this.showNotification('Por favor seleccione un estado válido para el lote', 'warning');
      return;
    }

    this.isLoading = true;
    this.updateBatch(cleanStatus);
  }

  // ✅ MÉTODO updateBatch COMPLETAMENTE CORREGIDO
  updateBatch(newStatus: BatchStatus, imageData?: string): void {
    if (!this.selectedBatch) {
      console.error('❌ No selected batch');
      return;
    }

    console.log('🚀 Starting batch update process...');
    console.log('   Selected Batch:', this.selectedBatch);
    console.log('   New Status (cleaned):', newStatus, typeof newStatus);

    // ✅ VALIDAR QUE EL ESTADO SEA VÁLIDO ANTES DE CONTINUAR
    const validStatuses: BatchStatus[] = ['ACEPTADO', 'RECHAZADO', 'POR_ENVIAR', 'ENVIADO'];
    if (!validStatuses.includes(newStatus)) {
      console.error('❌ Invalid status:', newStatus);
      this.showNotification(`Estado inválido: ${newStatus}`, 'error');
      this.isLoading = false;
      return;
    }

    // ✅ FUNCIÓN PARA LIMPIAR STRINGS Y EVITAR CARACTERES PROBLEMÁTICOS
    const cleanString = (str: string): string => {
      if (!str) return '';
      return str.toString()
        .replace(/\n/g, ' ')    // Cambiar saltos de línea por espacios
        .replace(/\r/g, ' ')    // Cambiar retornos de carro por espacios
        .replace(/\s+/g, ' ')   // Múltiples espacios por uno solo
        .trim();
    };

    // ✅ PREPARAR OBSERVACIONES LIMPIANDO CARACTERES PROBLEMÁTICOS
    const additionalComments = this.form.get('additionalComments')?.value || '';
    const existingObservations = this.selectedBatch.observations || '';

    let combinedObservations: string;
    if (additionalComments.trim()) {
      combinedObservations = cleanString(`${existingObservations} ${additionalComments}`);
    } else {
      combinedObservations = cleanString(existingObservations) || 'Sin observaciones';
    }

    const updatedBatch: Partial<Batch> = {
      // ✅ Estado limpio y validado
      status: newStatus,
      observations: combinedObservations,

      // ✅ CAMPOS REQUERIDOS - Todos limpiados
      code: cleanString(this.selectedBatch.code || ''),
      client: cleanString(this.selectedBatch.client || ''),
      businessmanId: this.selectedBatch.businessmanId?.toString() || '0',
      supplierId: this.selectedBatch.supplierId?.toString() || '0',
      fabricType: cleanString(this.selectedBatch.fabricType || ''),
      color: cleanString(this.selectedBatch.color || ''),
      quantity: Number(this.selectedBatch.quantity) || 1,
      price: Number(this.selectedBatch.price) || 0,
      address: cleanString(this.selectedBatch.address || ''),
      date: this.formatDateForBackend(this.selectedBatch.date)
    };

    // ✅ VALIDACIONES ADICIONALES
    if (!updatedBatch.code) updatedBatch.code = `BATCH-${Date.now()}`;
    if (!updatedBatch.client) updatedBatch.client = 'Cliente no especificado';
    if (!updatedBatch.fabricType) updatedBatch.fabricType = 'No especificado';
    if (!updatedBatch.color) updatedBatch.color = 'No especificado';
    if (!updatedBatch.observations) updatedBatch.observations = 'Sin observaciones';
    if (!updatedBatch.address) updatedBatch.address = 'Sin dirección';

    console.log('🚀 Sending cleaned batch data:');
    console.log('   Batch ID:', this.selectedBatch.id);
    console.log('   Update Data:', JSON.stringify(updatedBatch, null, 2));

    // ✅ VERIFICAR DATOS ANTES DE ENVIAR
    console.log('🔍 Pre-send verification:');
    console.log('   Status type:', typeof updatedBatch.status);
    console.log('   Status value:', updatedBatch.status);

    Object.entries(updatedBatch).forEach(([key, value]) => {
      if (typeof value === 'string' && (value.includes('\n') || value.includes('\r'))) {
        console.warn(`⚠️ Found line break in ${key}:`, value);
      }
      if (typeof value === 'object' && value !== null) {
        console.warn(`⚠️ Found object in ${key}:`, value);
      }
    });

    // ✅ ACTUALIZAR EL BATCH
    this.batchService.updateBatch(this.selectedBatch.id as string, updatedBatch).subscribe({
      next: (updatedBatchResponse) => {
        console.log('✅ Batch updated successfully:', updatedBatchResponse);

        if (this.selectedImage) {
          console.log('📷 Uploading image...');
          this.uploadImage();
        } else {
          this.showNotification(`Lote actualizado y marcado como ${newStatus} correctamente`, 'success');
          this.loadPendingBatches();
          this.setActiveTab('pending');
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('❌ Error updating batch:', error);

        let errorMessage = 'Error desconocido';
        if (error.message) {
          errorMessage = error.message;
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (typeof error.error === 'string') {
          errorMessage = error.error;
        }

        this.showNotification(`Error al actualizar el lote: ${errorMessage}`, 'error');
        this.isLoading = false;
      }
    });
  }

  // ✅ MÉTODO AUXILIAR PARA FORMATEAR FECHA
  private formatDateForBackend(dateString: string): string {
    if (!dateString) {
      return new Date().toISOString().slice(0, 10);
    }

    // Si ya está en formato YYYY-MM-DD, usar tal cual
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }

    // Si viene con tiempo, extraer solo la fecha
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }

    // Convertir cualquier otro formato a YYYY-MM-DD
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn('⚠️ Invalid date, using current date:', dateString);
      return new Date().toISOString().slice(0, 10);
    }

    return date.toISOString().slice(0, 10);
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
