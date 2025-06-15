// /src/app/core/services/supplier-review.service.ts
import { Injectable } from '@angular/core';
import { BaseService} from '../../core/services/base.service.service';
import { SupplierReview} from '../models/supplier-review.entity';
import {environment} from '../../../environments/environment';

const supplierReviewEndpointPath = environment.supplierReviewEndpointPath;

/**
 * Service responsible for managing supplier review operations.
 */
@Injectable({
  providedIn: 'root'
})
export class SupplierReviewService extends BaseService<SupplierReview> {
  constructor() {
    super();
    this.resourceEndpoint = supplierReviewEndpointPath;
  }

  /**
   * Añade una nueva reseña para un proveedor
   * @param supplierId ID del proveedor
   * @param businessmanId ID del empresario que hace la reseña
   * @param rating Calificación (1-5)
   * @param comment Comentario de la reseña
   * @param businessmanName Nombre del empresario (opcional)
   */
  addReview(supplierId: string, businessmanId: string, rating: number, comment: string, businessmanName?: string): any {
    const newReview: SupplierReview = {
      supplierId,
      businessmanId,
      rating,
      comment,
      businessmanName,
      createdAt: new Date().toISOString()
    };

    return this.create(newReview);
  }

  /**
   * Obtiene todas las reseñas de un proveedor
   * @param supplierId ID del proveedor
   * @param callback Función de retorno con las reseñas
   */
  getReviewsForSupplier(supplierId: string, callback: Function): void {
    this.http.get<SupplierReview[]>(`${this.serverBaseUrl}${this.resourceEndpoint}?supplierId=${supplierId}`)
      .subscribe({
        next: (reviews) => {
          callback(reviews);
        },
        error: (error) => {
          console.error('Error al obtener reseñas:', error);
          callback([]);
        }
      });
  }

  /**
   * Calcula el rating promedio de un proveedor
   * @param supplierId ID del proveedor
   * @param callback Función de retorno con el rating promedio y el total de reseñas
   */
  calculateAverageRating(supplierId: string, callback: Function): void {
    this.getReviewsForSupplier(supplierId, (reviews: SupplierReview[]) => {
      if (!reviews || reviews.length === 0) {
        callback(0, 0);
        return;
      }

      const sum = reviews.reduce((total, review) => total + review.rating, 0);
      const average = sum / reviews.length;
      callback(average, reviews.length);
    });
  }

  /**
   * Verifica si un empresario ya ha dejado una reseña para un proveedor específico
   * @param supplierId ID del proveedor
   * @param businessmanId ID del empresario
   * @param callback Función de retorno con booleano que indica si ya existe una reseña
   */
  hasBusinessmanReviewed(supplierId: string, businessmanId: string, callback: Function): void {
    this.http.get<SupplierReview[]>(
      `${this.serverBaseUrl}${this.resourceEndpoint}?supplierId=${supplierId}&businessmanId=${businessmanId}`
    ).subscribe({
      next: (reviews) => {
        callback(reviews && reviews.length > 0);
      },
      error: (error) => {
        console.error('Error al verificar reseñas:', error);
        callback(false);
      }
    });
  }

  updateReview(reviewId: string, rating: number, comment: string): any {
    // Alternativa más simple sin usar switchMap
    return {
      subscribe: (observer: any) => {
        this.http.get<SupplierReview>(`${this.serverBaseUrl}${this.resourceEndpoint}/${reviewId}`)
          .subscribe({
            next: (existingReview: SupplierReview) => {
              const updatedReview: SupplierReview = {
                ...existingReview,
                rating,
                comment
              };

              this.update(reviewId, updatedReview).subscribe(observer);
            },
            error: (error) => {
              if (observer.error) observer.error(error);
            }
          });
      }
    };
  }
}
