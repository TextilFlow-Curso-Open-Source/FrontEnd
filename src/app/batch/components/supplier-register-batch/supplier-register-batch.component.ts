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
  currentUserId: number = 0;

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

    // Usar getBySupplierId en lugar de getBatchesBySupplier que no existe
    this.batchService.getBySupplierId(this.currentUserId).subscribe({
      next: (batches: Batch[]) => {
        // Filtrar solo los lotes en estado pendiente o por enviar
        this.pendingBatches = batches.filter(batch =>
          batch.status === STATUS.PENDIENTE || batch.status === STATUS.POR_ENVIAR);
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
    this.imagePreview = ''; // Limpiar la vista previa
    this.selectedImage = null;

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
      status: batch.status, // Establecer el estado actual
      imageUrl: '',
      additionalComments: ''
    });
  }

  setActiveTab(tab: 'pending' | 'register'): void {
    this.activeTab = tab;
    if (tab === 'pending') {
      this.selectedBatch = null;
      this.imagePreview = '';
      this.selectedImage = null;
      this.form.reset();
      this.initForm();
    }
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.match(/image\/*/) && this.form) {
      this.selectedImage = file;

      // Crear vista previa
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);

      // También podrías comprimir aquí la imagen con canvas, pero para simplificar
      // solo vamos a actualizar el valor del formulario
      this.form.get('imageUrl')?.setValue(file.name);
    }
  }

  compressImage(base64: string, callback: (compressed: string) => void): void {
    // Crear una imagen temporal para manipularla
    const img = new Image();
    img.src = base64;

    img.onload = () => {
      // Crear un canvas para la compresión
      const canvas = document.createElement('canvas');
      // Reducir el tamaño manteniendo la proporción
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

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // Obtener la imagen comprimida (0.7 es un buen balance entre calidad y tamaño)
        const compressed = canvas.toDataURL('image/jpeg', 0.7);
        callback(compressed);
      }
    };
  }

  onSubmit(): void {
    if (!this.selectedBatch) {
      this.showNotification('Debe seleccionar un lote pendiente primero', 'warning');
      return;
    }

    if (this.form.invalid) {
      this.showNotification('Por favor complete todos los campos requeridos', 'warning');
      return;
    }

    // Verificar que se haya seleccionado un estado
    const newStatus = this.form.get('status')?.value as BatchStatus | null;
    if (!newStatus) {
      this.showNotification('Por favor seleccione un estado para el lote', 'warning');
      return;
    }

    this.isLoading = true;

    // Si hay una imagen seleccionada, procesarla
    if (this.selectedImage && this.imagePreview) {
      this.compressImage(this.imagePreview, (compressedImage) => {
        this.updateBatch(newStatus, compressedImage);
      });
    } else {
      this.updateBatch(newStatus);
    }
  }

  updateBatch(newStatus: BatchStatus, imageData?: string): void {
    if (!this.selectedBatch) return;

    // Obtener el lote completo antes de actualizarlo
    this.batchService.getById(this.selectedBatch.id as number).subscribe({
      next: (originalBatch: Batch) => {
        // Combinar el lote original con los campos a actualizar
        const updatedBatch: Batch = {
          ...originalBatch,
          status: newStatus,
          observations: this.form.get('additionalComments')?.value || originalBatch.observations
        };

        // Si hay imagen comprimida, incluirla
        if (imageData) {
          updatedBatch.imageUrl = imageData;
        }

        // Actualizar el lote completo
        this.batchService.update(this.selectedBatch?.id as number, updatedBatch).subscribe({
          next: () => {
            this.showNotification(`Lote actualizado y marcado como ${newStatus} correctamente`, 'success');
            this.loadPendingBatches();
            this.setActiveTab('pending');
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error al actualizar el lote:', error);
            this.showNotification('Error al actualizar el lote', 'error');
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error al obtener el lote original:', error);
        this.showNotification('Error al actualizar el lote', 'error');
        this.isLoading = false;
      }
    });
  }

  onCancel(): void {
    this.setActiveTab('pending');
    this.form.reset();
    this.initForm();
  }

  showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.notification = {
      show: true,
      message,
      type
    };
  }
}
