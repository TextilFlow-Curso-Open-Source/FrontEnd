// /src/app/requests/components/add-supplier/add-supplier.component.ts
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
import { TranslateModule, TranslateService } from "@ngx-translate/core";

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
  selectedSupplierId: string | null = null;
  currentUserId: string = '';
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
    businessmanId: '',
    supplierId: '',
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
  expandedSupplierId: string | null = null;
  newReview = {
    rating: 5,
    comment: ''
  };
  canAddReview: boolean = false;
  selectedReviewSupplierId: string | null = null;

  // Nuevo - Para la edición de reseñas
  isEditingReview: boolean = false;
  editingReviewId: string | null = null;
  isSubmitting: boolean = false; // Evitar envío duplicado
  hoverRatingValue: number = 0; // Para el hover de las estrellas

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
    private authService: AuthService,
    private translate: TranslateService
  ) {
    const user = this.authService.getCurrentUser();
    if (user && user.id) {
      this.currentUserId = user.id;
      this.currentUserName = user.name || 'Usuario';
      this.newBatch.businessmanId = this.currentUserId;
    } else {
      console.error('No hay usuario autenticado o falta ID');
      this.authService.logout();
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

    // Obtener solicitudes del businessman actual
    this.requestService.getRequestsByBusinessman(this.currentUserId).subscribe({
      next: (requests: any[]) => {
        // Filtrar y normalizar solicitudes aceptadas
        const acceptedRequests = requests
          .filter(req => req.status.toUpperCase() === 'ACCEPTED')
          .map(req => ({
            ...req,
            supplierId: req.supplierId.toString() // Asegurar tipo string
          }));

        // Obtener todos los proveedores
        this.supplierService.getAllSuppliers().subscribe({
          next: (suppliers: any[]) => {
            // Normalizar proveedores
            const normalizedSuppliers = suppliers.map(supplier => ({
              ...supplier,
              id: this.fixSupplierId(supplier), // Corregir IDs
              profile: this.ensureProfile(supplier) // Completar perfil
            }));

            // Actualizar listas
            this.updateSupplierLists(normalizedSuppliers, acceptedRequests);
            this.isLoading = false;
          },
          error: (error) => this.handleError(error)
        });
      },
      error: (error) => this.handleError(error)
    });
  }

  private updateSupplierLists(suppliers: any[], acceptedRequests: any[]) {
    // Proveedores conectados (con solicitud aceptada)
    this.connectedSuppliers = suppliers.filter(supplier =>
      acceptedRequests.some(req => req.supplierId === supplier.id)
    );

    // Proveedores disponibles (sin solicitud aceptada)
    this.availableSuppliers = suppliers.filter(supplier =>
      !this.connectedSuppliers.some(connected => connected.id === supplier.id)
    );

    // Actualizar vista
    this.updateDisplayedSuppliers();

    // Debug
    //console.log('Proveedores conectados:', this.connectedSuppliers);
    //console.log('Proveedores disponibles:', this.availableSuppliers);
  }

  private handleError(error: any) {
    console.error('Error:', error);
    this.isLoading = false;
    this.showNotification(
      this.translate.instant('ADD_SUPPLIER.LOAD_ERROR'),
      'error'
    );
  }

// Función auxiliar para corregir IDs
  private fixSupplierId(supplier: any): string {
    if (supplier.email === 'jime@gmail.com') return '3';
    if (supplier.email === 'supplier1@gmail.com') return '4';
    if (supplier.email === 'edu@gmail.com') return '5';
    return supplier.id?.toString() || '';
  }

// Función auxiliar para completar perfiles
  private ensureProfile(supplier: any): any {
    return supplier.profile || {
      companyName: supplier.companyName || this.generateCompanyName(supplier),
      specialization: supplier.specialization || '',
      productCategories: supplier.productCategories || [],
      warehouseLocation: supplier.warehouseLocation || '',
      minimumOrderQuantity: supplier.minimumOrderQuantity || 0,
      logo: supplier.logo || ''
    };
  }


  /**
   * Genera un nombre de empresa descriptivo cuando no existe companyName
   */
  private generateCompanyName(supplier: any): string {
    // Si hay email, usar la parte antes del @
    if (supplier.email) {
      const emailPart = supplier.email.split('@')[0];
      const cleanName = emailPart.charAt(0).toUpperCase() + emailPart.slice(1);
      return `${cleanName} Company`;
    }

    // Si hay nombre de usuario, usarlo
    if (supplier.name) {
      return `${supplier.name} Enterprise`;
    }

    // Fallback genérico
    return 'Empresa sin nombre';
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

    // Filtrar localmente - buscar en companyName directo y email
    this.filteredSuppliers = suppliersToFilter.filter(supplier =>
      supplier.email?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      supplier.companyName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      supplier.profile?.companyName?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );

    this.isLoading = false;

    if (this.filteredSuppliers.length === 0) {
      this.showNotification(
        this.translate.instant('ADD_SUPPLIER.NO_SEARCH_RESULTS'),
        'info'
      );
    }
  }

  selectSupplier(supplierId: string) {
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
  toggleSupplierExpansion(supplierId: string) {
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

  loadReviews(supplierId: string) {
    this.reviewService.getReviewsForSupplier(supplierId, (reviews: any[]) => {
      this.reviews = reviews;
      // Marcar las reseñas que pertenecen al usuario actual
      this.reviews.forEach(review => {
        review.canEdit = review.businessmanId === this.currentUserId;
      });
    });
  }

  checkIfCanAddReview(supplierId: string) {
    this.reviewService.hasBusinessmanReviewed(supplierId, this.currentUserId, (hasReviewed: boolean) => {
      this.canAddReview = !hasReviewed;
    });
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
      this.showNotification(
        this.translate.instant('ADD_SUPPLIER.RATING_RANGE_ERROR'),
        'warning'
      );
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
          this.showNotification(
            this.translate.instant('ADD_SUPPLIER.REVIEW_UPDATED_SUCCESS'),
            'success'
          );
          this.closeReviewForm();
          this.loadReviews(this.selectedReviewSupplierId as string);
          this.updateSupplierRating();
          this.isLoading = false;
          this.isSubmitting = false;
        },
        error: (error: any) => {
          console.error('Error al actualizar reseña:', error);
          this.showNotification(
            this.translate.instant('ADD_SUPPLIER.REVIEW_ERROR'),
            'error'
          );
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
          this.showNotification(
            this.translate.instant('ADD_SUPPLIER.REVIEW_ADDED_SUCCESS'),
            'success'
          );
          this.closeReviewForm();
          this.loadReviews(this.selectedReviewSupplierId as string);
          this.updateSupplierRating();
          this.canAddReview = false;
          this.isLoading = false;
          this.isSubmitting = false;
        },
        error: (error: any) => {
          console.error('Error al agregar reseña:', error);
          this.showNotification(
            this.translate.instant('ADD_SUPPLIER.REVIEW_ERROR'),
            'error'
          );
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

    // Validaciones con traducciones
    if (!this.newBatch.fabricType) {
      this.showNotification(
        this.translate.instant('ADD_SUPPLIER.VALIDATION_ERRORS.FABRIC_TYPE_REQUIRED'),
        'warning'
      );
      return;
    }

    if (!this.newBatch.color) {
      this.showNotification(
        this.translate.instant('ADD_SUPPLIER.VALIDATION_ERRORS.COLOR_REQUIRED'),
        'warning'
      );
      return;
    }

    if (!this.newBatch.quantity || this.newBatch.quantity <= 0) {
      this.showNotification(
        this.translate.instant('ADD_SUPPLIER.VALIDATION_ERRORS.QUANTITY_REQUIRED'),
        'warning'
      );
      return;
    }

    if (!this.newBatch.price || this.newBatch.price <= 0) {
      this.showNotification(
        this.translate.instant('ADD_SUPPLIER.VALIDATION_ERRORS.PRICE_REQUIRED'),
        'warning'
      );
      return;
    }

    if (!this.newBatch.address) {
      this.showNotification(
        this.translate.instant('ADD_SUPPLIER.VALIDATION_ERRORS.ADDRESS_REQUIRED'),
        'warning'
      );
      return;
    }

    this.isLoading = true;
    this.isBatchSubmitting = true; // Activar el bloqueo

    // Crear el nuevo batch usando el método createBatch del servicio
    this.batchService.createBatch(
      this.newBatch.code,
      this.newBatch.client,
      this.newBatch.businessmanId,
      this.newBatch.supplierId,
      this.newBatch.fabricType,
      this.newBatch.color,
      this.newBatch.price,
      this.newBatch.quantity,
      this.newBatch.observations || '',
      this.newBatch.address,
      this.newBatch.date,
      this.newBatch.imageUrl
    ).subscribe({
      next: () => {
        this.showNotification(
          this.translate.instant('ADD_SUPPLIER.BATCH_CREATED_SUCCESS'),
          'success'
        );
        this.showBatchForm = false;
        this.isLoading = false;
        this.isBatchSubmitting = false;
      },
      error: (error: any) => {
        console.error('Error al crear lote:', error);
        this.showNotification(
          this.translate.instant('ADD_SUPPLIER.BATCH_ERROR'),
          'error'
        );
        this.isLoading = false;
        this.isBatchSubmitting = false;
      }
    });
  }

  // Método para enviar solicitud a proveedor
  sendRequest() {

    if (!this.selectedSupplierId) {
      this.showNotification(
        this.translate.instant('ADD_SUPPLIER.VALIDATION_ERRORS.SELECT_SUPPLIER'),
        'warning'
      );
      return;
    }

    // Validaciones del formulario con traducciones
    if (this.showRequestForm) {
      if (!this.batchType) {
        this.showNotification(
          this.translate.instant('ADD_SUPPLIER.VALIDATION_ERRORS.FABRIC_TYPE_REQUIRED'),
          'warning'
        );
        return;
      }
      /*if (!this.batchType) {
        console.log('⚠️ batchType vacío');
        return;
      }*/

      if (!this.batchColor) {
        this.showNotification(
          this.translate.instant('ADD_SUPPLIER.VALIDATION_ERRORS.COLOR_REQUIRED'),
          'warning'
        );
        return;
      }


      if (this.quantity <= 0) {
        this.showNotification(
          this.translate.instant('ADD_SUPPLIER.VALIDATION_ERRORS.QUANTITY_REQUIRED'),
          'warning'
        );
        return;
      }


      if (!this.address) {
        this.showNotification(
          this.translate.instant('ADD_SUPPLIER.VALIDATION_ERRORS.ADDRESS_REQUIRED'),
          'warning'
        );
        return;
      }


    }

    if (this.isLoading) {
      return;
    }

    const supplierId = this.selectedSupplierId;
    this.isLoading = true;
    //console.log('🟢 Enviando request al backend');

    // Verificar si ya existe una solicitud activa
    this.requestService.checkExistingRequest(this.currentUserId, supplierId).subscribe({
      next: (requests: any[]) => {
        if (false && requests && requests.length > 0) {
          const status = requests[0].status;
          const messageKey = status === 'PENDING'
            ? 'ADD_SUPPLIER.REQUEST_PENDING'
            : 'ADD_SUPPLIER.CONNECTION_EXISTS';

          this.showNotification(
            this.translate.instant(messageKey),
            'warning'
          );
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
            this.showNotification(
              this.translate.instant('ADD_SUPPLIER.REQUEST_SENT_SUCCESS'),
              'success'
            );
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
            this.showNotification(
              this.translate.instant('ADD_SUPPLIER.REQUEST_ERROR'),
              'error'
            );
            this.isLoading = false;
          }
        });
      },
      error: (error: any) => {
        console.error('Error al verificar solicitudes existentes:', error);
        this.showNotification(
          this.translate.instant('ADD_SUPPLIER.REQUEST_CHECK_ERROR'),
          'error'
        );
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

  // Estrellas estáticas - sin funciones auxiliares

  // Métodos actualizados para el rating clickeable
  setRating(rating: number) {
    this.newReview.rating = rating;
  }

  hoverRating(rating: number) {
    this.hoverRatingValue = rating;
  }

  // Actualizar el método openReviewForm para resetear el hover
  openReviewForm(supplierId: string) {
    this.selectedReviewSupplierId = supplierId;
    this.showReviewForm = true;
    this.isEditingReview = false;
    this.editingReviewId = null;
    this.hoverRatingValue = 0; // Resetear hover
    this.newReview = {
      rating: 5,
      comment: ''
    };
  }

  // Actualizar el método editReview para resetear el hover
  editReview(review: any) {
    this.selectedReviewSupplierId = review.supplierId;
    this.editingReviewId = review.id;
    this.isEditingReview = true;
    this.showReviewForm = true;
    this.hoverRatingValue = 0; // Resetear hover
    this.newReview = {
      rating: review.rating,
      comment: review.comment
    };
  }

  // Añadir estos métodos a tu clase del componente
  onSearchInput(): void {
    // Opcional: búsqueda en tiempo real
    if (this.searchTerm.length > 2 || this.searchTerm.length === 0) {
      this.searchSuppliers();
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchSuppliers();
  }
}
