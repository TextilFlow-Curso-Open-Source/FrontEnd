// add-supplier.component.ts (con las correcciones)
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupplierService } from '../../../supplier/services/supplier.service';
import { SupplierRequestService } from '../../services/supplier-request-service.service';
import { SupplierReviewService } from '../../../supplier/services/supplier-review.service';
import { AuthService } from '../../../auth/services/auth.service';
import { AppInputComponent } from '../../../core/components/app-input/app-input.component';
import { AppButtonComponent } from '../../../core/components/app-button/app-button.component';
import { AppNotificationComponent } from '../../../core/components/app-notification/app-notification.component';
import { BatchService } from '../../../batch/services/batch.service.service';
import { Batch, BatchStatus, STATUS } from '../../../batch/models/batch.entity';
import {TranslateModule} from "@ngx-translate/core";

@Component({
  selector: 'app-add-supplier',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AppInputComponent,
    AppButtonComponent,
    AppNotificationComponent,
    TranslateModule
  ],
  templateUrl: './add-supplier.component.html',
  styleUrls: ['./add-supplier.component.css']
})
export class AddSupplierComponent implements OnInit {
  // Control de pestañas
  activeTab: 'current' | 'add' = 'current';

  // Búsqueda
  searchTerm: string = '';
  suppliers: any[] = [];
  filteredSuppliers: any[] = [];
  isLoading: boolean = false;

  // Selección y detalles de proveedor
  selectedSupplierId: number | null = null;
  currentUserId: number = 0;
  currentUserName: string = '';
  isBatchSubmitting: boolean = false;

  // Modal de solicitud
  showRequestForm: boolean = false;
  selectedSupplier: any = null;
  batchType: string = '';
  batchColor: string = '';
  quantity: number = 0;
  address: string = '';
  requestMessage: string = '';

  // Modal para batch
  showBatchForm: boolean = false;
  newBatch: Batch = new Batch({
    code: '',
    client: '',
    businessmanId: 0,
    supplierId: 0,
    fabricType: '',
    color: '',
    quantity: 0,
    price: 0,
    observations: '',
    address: '',
    date: new Date().toISOString().split('T')[0],
    status: STATUS.POR_ENVIAR,
    imageUrl: ''
  });

  // Reseñas
  reviews: any[] = [];
  showReviewForm: boolean = false;
  expandedSupplierId: number | null = null;
  newReview = {
    rating: 5,
    comment: ''
  };
  canAddReview: boolean = false;
  selectedReviewSupplierId: number | null = null;

  // Nuevo - Para la edición de reseñas
  isEditingReview: boolean = false;
  editingReviewId: number | null = null;
  isSubmitting: boolean = false; // Evitar envío duplicado

  // Datos para mostrar en las pestañas
  connectedSuppliers: any[] = []; // Proveedores con solicitudes aceptadas
  availableSuppliers: any[] = []; // Proveedores disponibles para solicitar

  // Colores disponibles para el formulario - define as readonly to prevent modification
  readonly colors: string[] = ['Rojo', 'Azul', 'Verde', 'Negro', 'Blanco', 'Amarillo', 'Morado', 'Naranja', 'Gris'];

  // Notificación
  notification = {
    show: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'warning' | 'info'
  };

  constructor(
    private supplierService: SupplierService,
    private requestService: SupplierRequestService,
    private reviewService: SupplierReviewService,
    private batchService: BatchService,
    private authService: AuthService
  ) {
    const user = this.authService.getCurrentUser();
    if (user && user.id) {
      this.currentUserId = user.id;
      this.currentUserName = user.name || 'Usuario';
      this.newBatch.businessmanId = this.currentUserId;
    }
  }

  ngOnInit() {
    this.loadData();
  }

  setActiveTab(tab: 'current' | 'add') {
    this.activeTab = tab;
    this.updateDisplayedSuppliers();
  }

  loadData() {
    this.isLoading = true;

    // Primero cargar todas las solicitudes aceptadas
    this.requestService.getRequestsByBusinessman(this.currentUserId, (requests: any[]) => {
      // Filtrar solo las solicitudes aceptadas
      const acceptedRequests = requests.filter(req => req.status === 'accepted');

      // Luego cargar todos los proveedores
      this.supplierService.getAllSuppliers((suppliers: any[]) => {
        this.suppliers = suppliers;

        // Para cada proveedor, cargar sus detalles
        this.suppliers.forEach(supplier => {
          this.supplierService.getProfileByUserId(supplier.id, (profile: any) => {
            supplier.profile = profile;

            // Cargar calificaciones
            this.reviewService.calculateAverageRating(supplier.id, (avgRating: number, totalReviews: number) => {
              supplier.averageRating = avgRating;
              supplier.totalReviews = totalReviews;
            });
          });
        });

        // Separar los proveedores conectados de los disponibles
        this.connectedSuppliers = [];
        this.availableSuppliers = [];

        // Para cada solicitud aceptada, buscar el proveedor correspondiente
        acceptedRequests.forEach(request => {
          const connectedSupplier = this.suppliers.find(s => s.id === request.supplierId);
          if (connectedSupplier) {
            // Añadir el request a los detalles del proveedor para referencia
            connectedSupplier.request = request;
            this.connectedSuppliers.push(connectedSupplier);
          }
        });

        // Los proveedores disponibles son aquellos que no están conectados
        this.availableSuppliers = this.suppliers.filter(supplier =>
          !this.connectedSuppliers.some(connectedSupplier => connectedSupplier.id === supplier.id)
        );

        this.updateDisplayedSuppliers();
        this.isLoading = false;
      });
    });
  }

  updateDisplayedSuppliers() {
    // Actualizar los proveedores mostrados según la pestaña activa
    if (this.activeTab === 'current') {
      this.filteredSuppliers = [...this.connectedSuppliers];
    } else {
      this.filteredSuppliers = [...this.availableSuppliers];
    }

    // Si hay una búsqueda activa, aplicarla
    if (this.searchTerm.trim()) {
      this.searchSuppliers();
    }
  }

  searchSuppliers() {
    if (!this.searchTerm.trim()) {
      this.updateDisplayedSuppliers(); // Restablecer según la pestaña activa
      return;
    }

    this.isLoading = true;

    // Determinar qué lista de proveedores filtrar según la pestaña activa
    const suppliersToFilter = this.activeTab === 'current' ?
      this.connectedSuppliers : this.availableSuppliers;

    // Filtrar localmente
    this.filteredSuppliers = suppliersToFilter.filter(supplier =>
      supplier.email?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      supplier.profile?.companyName?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );

    this.isLoading = false;

    if (this.filteredSuppliers.length === 0) {
      this.showNotification('No se encontraron proveedores con ese criterio de búsqueda', 'info');
    }
  }

  clearSearch() {
    this.searchTerm = '';
    this.updateDisplayedSuppliers();
  }

  selectSupplier(supplierId: number) {
    // Si ya está seleccionado, lo deseleccionamos
    if (this.selectedSupplierId === supplierId) {
      this.selectedSupplierId = null;
      return;
    }

    this.selectedSupplierId = supplierId;
    this.selectedSupplier = this.filteredSuppliers.find(s => s.id === supplierId);

    // Cargar reviews si están disponibles
    this.loadReviews(supplierId);
  }

  // Método para expandir un proveedor en la pestaña "Distribuidores Actuales"
  toggleSupplierExpansion(supplierId: number) {
    if (this.expandedSupplierId === supplierId) {
      this.expandedSupplierId = null;
    } else {
      this.expandedSupplierId = supplierId;
      // Cargar reviews para este proveedor
      this.loadReviews(supplierId);

      // Verificar si el usuario puede dejar una reseña
      this.checkIfCanAddReview(supplierId);
    }
  }

  loadReviews(supplierId: number) {
    this.reviewService.getReviewsForSupplier(supplierId, (reviews: any[]) => {
      this.reviews = reviews;
      // Marcar las reseñas que pertenecen al usuario actual
      this.reviews.forEach(review => {
        review.canEdit = review.businessmanId === this.currentUserId;
      });
    });
  }

  checkIfCanAddReview(supplierId: number) {
    this.reviewService.hasBusinessmanReviewed(supplierId, this.currentUserId, (hasReviewed: boolean) => {
      this.canAddReview = !hasReviewed;
    });
  }

  openReviewForm(supplierId: number) {
    this.selectedReviewSupplierId = supplierId;
    this.showReviewForm = true;
    this.isEditingReview = false;
    this.editingReviewId = null;
    this.newReview = {
      rating: 5,
      comment: ''
    };
  }

  // Nuevo método para editar una reseña existente
  editReview(review: any) {
    this.selectedReviewSupplierId = review.supplierId;
    this.editingReviewId = review.id;
    this.isEditingReview = true;
    this.showReviewForm = true;
    this.newReview = {
      rating: review.rating,
      comment: review.comment
    };
  }

  closeReviewForm() {
    this.showReviewForm = false;
    this.selectedReviewSupplierId = null;
    this.isEditingReview = false;
    this.editingReviewId = null;
  }

  submitReview() {
    if (!this.selectedReviewSupplierId || this.isSubmitting) {
      return;
    }

    if (this.newReview.rating < 1 || this.newReview.rating > 5) {
      this.showNotification('La calificación debe estar entre 1 y 5 estrellas', 'warning');
      return;
    }

    this.isLoading = true;
    this.isSubmitting = true; // Prevenir envíos duplicados

    if (this.isEditingReview && this.editingReviewId) {
      // Actualizar reseña existente
      this.reviewService.updateReview(
        this.editingReviewId,
        this.newReview.rating,
        this.newReview.comment
      ).subscribe({
        next: () => {
          this.showNotification('Reseña actualizada correctamente', 'success');
          this.closeReviewForm();
          this.loadReviews(this.selectedReviewSupplierId as number);
          this.updateSupplierRating();
          this.isLoading = false;
          this.isSubmitting = false;
        },
        error: (error: any) => {
          console.error('Error al actualizar reseña:', error);
          this.showNotification('Error al actualizar la reseña', 'error');
          this.isLoading = false;
          this.isSubmitting = false;
        }
      });
    } else {
      // Crear nueva reseña
      this.reviewService.addReview(
        this.selectedReviewSupplierId,
        this.currentUserId,
        this.newReview.rating,
        this.newReview.comment,
        this.currentUserName
      ).subscribe({
        next: () => {
          this.showNotification('Reseña agregada correctamente', 'success');
          this.closeReviewForm();
          this.loadReviews(this.selectedReviewSupplierId as number);
          this.updateSupplierRating();
          this.canAddReview = false;
          this.isLoading = false;
          this.isSubmitting = false;
        },
        error: (error: any) => {
          console.error('Error al agregar reseña:', error);
          this.showNotification('Error al agregar la reseña', 'error');
          this.isLoading = false;
          this.isSubmitting = false;
        }
      });
    }
  }

  // Método auxiliar para actualizar la calificación del proveedor
  updateSupplierRating() {
    if (this.selectedReviewSupplierId) {
      this.reviewService.calculateAverageRating(
        this.selectedReviewSupplierId,
        (avgRating: number, totalReviews: number) => {
          const supplier = this.filteredSuppliers.find(s => s.id === this.selectedReviewSupplierId);
          if (supplier) {
            supplier.averageRating = avgRating;
            supplier.totalReviews = totalReviews;
          }
        }
      );
    }
  }

  // Métodos para la solicitud de proveedor
  showRequestFormFor(supplier: any) {
    this.selectedSupplier = supplier;
    this.selectedSupplierId = supplier.id;
    this.showRequestForm = true;

    // Reset form values
    this.batchType = '';
    this.batchColor = '';
    this.quantity = 0;
    this.address = '';
    this.requestMessage = '';
  }

  cancelRequest() {
    this.showRequestForm = false;
    this.batchType = '';
    this.batchColor = '';
    this.quantity = 0;
    this.address = '';
    this.requestMessage = '';
  }

  // Métodos para la creación de batch
  showBatchFormFor(supplier: any) {
    this.selectedSupplier = supplier;
    this.selectedSupplierId = supplier.id;
    this.showBatchForm = true;

    // Inicializar el nuevo batch
    const today = new Date().toISOString().split('T')[0];
    this.newBatch = {
      code: 'L-' + Math.floor(1000 + Math.random() * 9000), // Código aleatorio
      client: this.currentUserName,
      businessmanId: this.currentUserId,
      supplierId: supplier.id,
      fabricType: '',
      color: '',
      quantity: 0,
      price: 0,
      observations: '',
      address: '',
      date: today,
      status: STATUS.PENDIENTE,
      imageUrl: ''
    };
  }

  cancelBatch() {
    this.showBatchForm = false;
    this.selectedSupplierId = null;
  }

  createBatch() {
    // Agregar esta validación al inicio
    if (this.isBatchSubmitting) {
      return; // Evitar múltiples envíos
    }

    // Validaciones
    if (!this.newBatch.fabricType) {
      this.showNotification('Por favor, ingresa el tipo de tela', 'warning');
      return;
    }

    if (!this.newBatch.color) {
      this.showNotification('Por favor, selecciona un color', 'warning');
      return;
    }

    if (!this.newBatch.quantity || this.newBatch.quantity <= 0) {
      this.showNotification('Por favor, ingresa una cantidad válida', 'warning');
      return;
    }

    if (!this.newBatch.price || this.newBatch.price <= 0) {
      this.showNotification('Por favor, ingresa un precio válido', 'warning');
      return;
    }

    if (!this.newBatch.address) {
      this.showNotification('Por favor, ingresa la dirección de entrega', 'warning');
      return;
    }

    this.isLoading = true;
    this.isBatchSubmitting = true; // Activar el bloqueo

    // Crear el nuevo batch
    this.batchService.create(this.newBatch).subscribe({
      next: () => {
        this.showNotification('Lote creado correctamente', 'success');
        this.showBatchForm = false;
        this.isLoading = false;
        this.isBatchSubmitting = false; // Desactivar el bloqueo
      },
      error: (error: any) => {
        console.error('Error al crear lote:', error);
        this.showNotification('Error al crear el lote', 'error');
        this.isLoading = false;
        this.isBatchSubmitting = false; // Desactivar el bloqueo
      }
    });
  }

  // Método para enviar solicitud a proveedor
  sendRequest() {
    if (!this.selectedSupplierId) {
      this.showNotification('Selecciona un proveedor', 'warning');
      return;
    }

    // Validaciones del formulario
    if (this.showRequestForm) {
      if (!this.batchType) {
        this.showNotification('Por favor, ingresa el tipo de tela', 'warning');
        return;
      }

      if (!this.batchColor) {
        this.showNotification('Por favor, selecciona un color', 'warning');
        return;
      }

      if (this.quantity <= 0) {
        this.showNotification('Por favor, ingresa una cantidad válida', 'warning');
        return;
      }

      if (!this.address) {
        this.showNotification('Por favor, ingresa la dirección de entrega', 'warning');
        return;
      }
    }

    if (this.isLoading) {
      return;
    }

    const supplierId = this.selectedSupplierId;
    this.isLoading = true;

    // Verificar si ya existe una solicitud activa
    this.requestService.checkExistingRequest(this.currentUserId, supplierId).subscribe({
      next: (requests: any[]) => {
        if (requests && requests.length > 0) {
          const status = requests[0].status;
          const message = status === 'pending'
            ? 'Ya has enviado una solicitud a este proveedor que está pendiente de respuesta'
            : 'Ya tienes una conexión activa con este proveedor';

          this.showNotification(message, 'warning');
          this.isLoading = false;
          return;
        }

        // Crear nueva solicitud
        this.requestService.createRequest(
          this.currentUserId,
          supplierId,
          this.requestMessage,
          this.batchType,
          this.batchColor,
          this.quantity,
          this.address
        ).subscribe({
          next: () => {
            this.showNotification('Solicitud enviada correctamente', 'success');
            this.showRequestForm = false;
            this.batchType = '';
            this.batchColor = '';
            this.quantity = 0;
            this.address = '';
            this.requestMessage = '';
            this.isLoading = false;

            // Recargar datos para actualizar las listas
            this.loadData();
          },
          error: (error: any) => {
            console.error('Error al enviar solicitud:', error);
            this.showNotification('Error al enviar la solicitud', 'error');
            this.isLoading = false;
          }
        });
      },
      error: (error: any) => {
        console.error('Error al verificar solicitudes existentes:', error);
        this.showNotification('Error al verificar solicitudes existentes', 'error');
        this.isLoading = false;
      }
    });
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

  // Funciones auxiliares para mostrar estrellas
  getFilledStars(rating: number): number[] {
    const validRating = Math.min(Math.max(0, rating || 0), 5); // Asegurar que esté entre 0 y 5
    return Array(Math.floor(validRating)).fill(0);
  }

  getEmptyStars(rating: number): number[] {
    const validRating = Math.min(Math.max(0, rating || 0), 5); // Asegurar que esté entre 0 y 5
    return Array(5 - Math.floor(validRating)).fill(0);
  }
}
