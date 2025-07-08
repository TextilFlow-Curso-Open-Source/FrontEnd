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
  activeTab: 'current' | 'add' = 'current';
  searchTerm: string = '';
  suppliers: any[] = [];
  filteredSuppliers: any[] = [];
  isLoading: boolean = false;
  selectedSupplierId: string | null = null;
  currentUserId: string = '';
  currentUserName: string = '';
  isBatchSubmitting: boolean = false;
  showRequestForm: boolean = false;
  selectedSupplier: any = null;
  batchType: string = '';
  batchColor: string = '';
  quantity: number = 0;
  address: string = '';
  requestMessage: string = '';
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
  reviews: any[] = [];
  showReviewForm: boolean = false;
  expandedSupplierId: string | null = null;
  newReview = {
    rating: 5,
    comment: ''
  };
  canAddReview: boolean = false;
  selectedReviewSupplierId: string | null = null;
  isEditingReview: boolean = false;
  editingReviewId: string | null = null;
  isSubmitting: boolean = false;
  hoverRatingValue: number = 0;
  connectedSuppliers: any[] = [];
  availableSuppliers: any[] = [];
  readonly colors: string[] = ['Rojo', 'Azul', 'Verde', 'Negro', 'Blanco', 'Amarillo', 'Morado', 'Naranja', 'Gris'];
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

    this.requestService.getRequestsByBusinessman(this.currentUserId).subscribe({
      next: (requests: any[]) => {
        const acceptedRequests = requests.filter(req => req.status.toUpperCase() === 'ACCEPTED');

        this.supplierService.getAllSuppliers().subscribe({
          next: (suppliers: any[]) => {
            const normalizedSuppliers = suppliers.map((supplier) => {
              const realId = supplier.userId || supplier.id;
              return {
                ...supplier,
                id: realId.toString(),
                originalId: supplier.id,
                originalUserId: supplier.userId,
                profile: this.ensureProfile(supplier)
              };
            });

            this.updateSupplierLists(normalizedSuppliers, acceptedRequests);
            this.isLoading = false;
          },
          error: (error) => {
            this.handleError(error);
          }
        });
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }

  private updateSupplierLists(suppliers: any[], acceptedRequests: any[]) {
    const connectedSupplierIds = new Set(
      acceptedRequests.map(req => req.supplierId?.toString())
        .filter(id => id && id !== 'undefined' && id !== 'null')
    );

    this.connectedSuppliers = suppliers.filter(supplier => connectedSupplierIds.has(supplier.id?.toString()));
    this.availableSuppliers = suppliers.filter(supplier => !connectedSupplierIds.has(supplier.id?.toString()));
    this.updateDisplayedSuppliers();
  }

  private handleError(error: any) {
    console.error('Error:', error);
    this.isLoading = false;
    this.showNotification(
      this.translate.instant('ADD_SUPPLIER.LOAD_ERROR'),
      'error'
    );
  }

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

  private generateCompanyName(supplier: any): string {
    if (supplier.email) {
      const emailPart = supplier.email.split('@')[0];
      const cleanName = emailPart.charAt(0).toUpperCase() + emailPart.slice(1);
      return `${cleanName} Company`;
    }

    if (supplier.name) {
      return `${supplier.name} Enterprise`;
    }

    return 'Empresa sin nombre';
  }

  updateDisplayedSuppliers() {
    this.filteredSuppliers = this.activeTab === 'current'
      ? [...this.connectedSuppliers]
      : [...this.availableSuppliers];

    if (this.searchTerm.trim()) {
      this.searchSuppliers();
    }
  }

  searchSuppliers() {
    if (!this.searchTerm.trim()) {
      this.updateDisplayedSuppliers();
      return;
    }

    this.isLoading = true;
    const suppliersToFilter = this.activeTab === 'current'
      ? this.connectedSuppliers
      : this.availableSuppliers;

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
    if (this.selectedSupplierId === supplierId) {
      this.selectedSupplierId = null;
      return;
    }

    this.selectedSupplierId = supplierId;
    this.selectedSupplier = this.filteredSuppliers.find(s => s.id === supplierId);
    this.loadReviews(supplierId);
  }

  toggleSupplierExpansion(supplierId: string) {
    if (this.expandedSupplierId === supplierId) {
      this.expandedSupplierId = null;
    } else {
      this.expandedSupplierId = supplierId;
      this.loadReviews(supplierId);
      this.checkIfCanAddReview(supplierId);
    }
  }

  loadReviews(supplierId: string) {
    this.reviewService.getReviewsForSupplier(supplierId, (reviews: any[]) => {
      this.reviews = reviews.map(review => ({
        ...review,
        canEdit: review.businessmanId === this.currentUserId
      }));
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
    this.isSubmitting = true;

    if (this.isEditingReview && this.editingReviewId) {
      this.reviewService.updateReview(
        this.editingReviewId,
        this.newReview.rating,
        this.newReview.comment
      ).subscribe({
        next: () => {
          this.handleReviewSuccess('ADD_SUPPLIER.REVIEW_UPDATED_SUCCESS');
        },
        error: (error: any) => {
          this.handleReviewError(error);
        }
      });
    } else {
      this.reviewService.addReview(
        this.selectedReviewSupplierId,
        this.currentUserId,
        this.newReview.rating,
        this.newReview.comment,
        this.currentUserName
      ).subscribe({
        next: () => {
          this.handleReviewSuccess('ADD_SUPPLIER.REVIEW_ADDED_SUCCESS');
          this.canAddReview = false;
        },
        error: (error: any) => {
          this.handleReviewError(error);
        }
      });
    }
  }

  private handleReviewSuccess(messageKey: string) {
    this.showNotification(
      this.translate.instant(messageKey),
      'success'
    );
    this.closeReviewForm();
    if (this.selectedReviewSupplierId) {
      this.loadReviews(this.selectedReviewSupplierId);
      this.updateSupplierRating();
    }
    this.isLoading = false;
    this.isSubmitting = false;
  }

  private handleReviewError(error: any) {
    console.error('Error en reseña:', error);
    this.showNotification(
      this.translate.instant('ADD_SUPPLIER.REVIEW_ERROR'),
      'error'
    );
    this.isLoading = false;
    this.isSubmitting = false;
  }

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

  showRequestFormFor(supplier: any) {
    this.selectedSupplier = supplier;
    this.selectedSupplierId = supplier.id;
    this.showRequestForm = true;
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

  showBatchFormFor(supplier: any) {
    this.selectedSupplier = supplier;
    this.selectedSupplierId = supplier.id;
    this.showBatchForm = true;

    this.newBatch = {
      code: 'L-' + Math.floor(1000 + Math.random() * 9000),
      client: this.currentUserName,
      businessmanId: this.currentUserId,
      supplierId: supplier.id,
      fabricType: '',
      color: '',
      quantity: 0,
      price: 0,
      observations: '',
      address: '',
      date: new Date().toISOString().split('T')[0],
      status: STATUS.PENDIENTE,
      imageUrl: ''
    };
  }

  cancelBatch() {
    this.showBatchForm = false;
    this.selectedSupplierId = null;
  }

  createBatch() {
    if (this.isBatchSubmitting) {
      return;
    }

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
    this.isBatchSubmitting = true;

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

  sendRequest() {
    if (!this.selectedSupplierId) {
      this.showNotification(
        this.translate.instant('ADD_SUPPLIER.VALIDATION_ERRORS.SELECT_SUPPLIER'),
        'warning'
      );
      return;
    }

    if (this.showRequestForm) {
      if (!this.batchType) {
        this.showNotification(
          this.translate.instant('ADD_SUPPLIER.VALIDATION_ERRORS.FABRIC_TYPE_REQUIRED'),
          'warning'
        );
        return;
      }

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
    if (supplierId === this.currentUserId) {
      this.showNotification(
        this.translate.instant('ADD_SUPPLIER.REQUEST_SELF_ERROR'),
        'error'
      );
      this.isLoading = false;
      return;
    }

    this.isLoading = true;

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
            this.resetRequestForm();
            this.isLoading = false;
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

  private resetRequestForm() {
    this.batchType = '';
    this.batchColor = '';
    this.quantity = 0;
    this.address = '';
    this.requestMessage = '';
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

  setRating(rating: number) {
    this.newReview.rating = rating;
  }

  hoverRating(rating: number) {
    this.hoverRatingValue = rating;
  }

  openReviewForm(supplierId: string) {
    this.selectedReviewSupplierId = supplierId;
    this.showReviewForm = true;
    this.isEditingReview = false;
    this.editingReviewId = null;
    this.hoverRatingValue = 0;
    this.newReview = {
      rating: 5,
      comment: ''
    };
  }

  editReview(review: any) {
    this.selectedReviewSupplierId = review.supplierId;
    this.editingReviewId = review.id;
    this.isEditingReview = true;
    this.showReviewForm = true;
    this.hoverRatingValue = 0;
    this.newReview = {
      rating: review.rating,
      comment: review.comment
    };
  }

  onSearchInput(): void {
    if (this.searchTerm.length > 2 || this.searchTerm.length === 0) {
      this.searchSuppliers();
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchSuppliers();
  }
}
