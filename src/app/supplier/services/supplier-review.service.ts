// /src/app/core/services/supplier-review.service.ts
import { Injectable } from '@angular/core';
import { BaseService } from '../../core/services/base.service';
import { SupplierReview } from '../models/supplier-review.entity';
import { BusinessmanService } from '../../businessman/services/businessman.service';
import { environment } from '../../../environments/environment';
import { map, Observable, forkJoin, of } from 'rxjs';

const supplierReviewEndpointPath = environment.supplierReviewEndpointPath;

/**
 * Service responsible for managing supplier review operations.
 * Updated to work with Spring Boot backend API
 */
@Injectable({
  providedIn: 'root'
})
export class SupplierReviewService extends BaseService<SupplierReview> {
  constructor(private businessmanService: BusinessmanService) {
    super();
    this.resourceEndpoint = supplierReviewEndpointPath;
  }

  /**
   * Adds a new review for a supplier
   * @param supplierId Supplier ID
   * @param businessmanId Businessman ID who makes the review
   * @param rating Rating (1-5)
   * @param comment Review comment
   * @param businessmanName Businessman name (optional, for UI)
   */
  addReview(supplierId: string, businessmanId: string, rating: number, comment: string, businessmanName?: string): Observable<SupplierReview> {
    const createRequest = {
      supplierId: this.transformIdToLong(supplierId),
      businessmanId: this.transformIdToLong(businessmanId),
      rating: rating,
      reviewContent: comment // Backend expects 'reviewContent' not 'comment'
    };

    return this.customRequest<any>(`${this.resourceEndpoint}`, 'POST', createRequest).pipe(
      map(response => this.transformBackendToFrontend(response, businessmanName))
    );
  }

  /**
   * Gets all reviews for a supplier
   * @param supplierId Supplier ID
   * @param callback Callback function with the reviews
   */
  getReviewsForSupplier(supplierId: string, callback: Function): void {
    if (!supplierId || supplierId === 'null' || supplierId === 'undefined') {
      console.error('supplierId is invalid:', supplierId);
      callback([]);
      return;
    }
    const supplierIdLong = this.transformIdToLong(supplierId);

    this.customRequest<any[]>(`${this.resourceEndpoint}/supplier/${supplierIdLong}`, 'GET')
      .subscribe({
        next: (reviews) => {
          // Transform all reviews and get businessman names
          this.enrichReviewsWithBusinessmanNames(reviews).subscribe({
            next: (enrichedReviews) => {
              callback(enrichedReviews);
            },
            error: (error) => {
              console.error('Error enriching reviews:', error);
              // If getting names fails, return reviews without names
              const basicReviews = reviews.map(review => this.transformBackendToFrontend(review));
              callback(basicReviews);
            }
          });
        },
        error: (error) => {
          console.error('Error getting reviews:', error);
          callback([]);
        }
      });
  }

  /**
   * Calculates the average rating of a supplier on the frontend
   * @param supplierId Supplier ID
   * @param callback Callback function with the average rating and total reviews
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
   * Verifies if a businessman has already left a review for a specific supplier
   * @param supplierId Supplier ID
   * @param businessmanId Businessman ID
   * @param callback Callback function with boolean indicating if a review already exists
   */
  hasBusinessmanReviewed(supplierId: string, businessmanId: string, callback: Function): void {
    const supplierIdLong = this.transformIdToLong(supplierId);
    const businessmanIdLong = this.transformIdToLong(businessmanId);

    this.customRequest<boolean>(`${this.resourceEndpoint}/check/${supplierIdLong}/${businessmanIdLong}`, 'GET')
      .subscribe({
        next: (hasReviewed) => {
          callback(hasReviewed);
        },
        error: (error) => {
          console.error('Error checking reviews:', error);
          callback(false);
        }
      });
  }

  /**
   * Updates an existing review
   * @param reviewId Review ID
   * @param rating New rating
   * @param comment New comment
   */
  updateReview(reviewId: string, rating: number, comment: string): Observable<SupplierReview> {
    const updateRequest = {
      rating: rating,
      reviewContent: comment // Backend expects 'reviewContent'
    };

    const reviewIdLong = this.transformIdToLong(reviewId);

    return this.customRequest<any>(`${this.resourceEndpoint}/${reviewIdLong}`, 'PUT', updateRequest).pipe(
      map(response => this.transformBackendToFrontend(response))
    );
  }

  /**
   * Transforms backend response to frontend format
   * @param backendReview Backend review
   * @param businessmanName Businessman name (optional)
   */
  private transformBackendToFrontend(backendReview: any, businessmanName?: string): SupplierReview {
    return new SupplierReview({
      id: this.transformIdToString(backendReview.id),
      supplierId: this.transformIdToString(backendReview.supplierId),
      businessmanId: this.transformIdToString(backendReview.businessmanId),
      rating: backendReview.rating,
      comment: backendReview.reviewContent, // Map 'reviewContent' to 'comment'
      createdAt: backendReview.createdAt,
      businessmanName: businessmanName
    });
  }

  /**
   * Enriches reviews with businessman names
   * @param reviews Array of backend reviews
   */
  private enrichReviewsWithBusinessmanNames(reviews: any[]): Observable<SupplierReview[]> {
    if (!reviews || reviews.length === 0) {
      return of([]);
    }

    // Get unique businessman IDs
    const businessmanIds = [...new Set(reviews.map(review => this.transformIdToString(review.businessmanId)))];

    // Create observables to get information for each businessman
    const businessmanRequests = businessmanIds.map(id =>
      this.businessmanService.getProfileByUserId(id).pipe(
        map(businessman => ({ id, name: businessman.name })),
        // If getting a businessman fails, continue with default name
        map(result => result),
        // In case of error, return object with default name
      )
    );

    // Execute all requests in parallel
    return forkJoin(businessmanRequests).pipe(
      map(businessmanInfos => {
        // Create map of ID -> name for fast lookup
        const businessmanNameMap = new Map<string, string>();
        businessmanInfos.forEach(info => {
          if (info && info.name) {
            businessmanNameMap.set(info.id, info.name);
          }
        });

        // Transform reviews with names
        return reviews.map(review => {
          const businessmanId = this.transformIdToString(review.businessmanId);
          const businessmanName = businessmanNameMap.get(businessmanId) || 'User';
          return this.transformBackendToFrontend(review, businessmanName);
        });
      }),
      // If the entire operation fails, return basic reviews
      map(enrichedReviews => enrichedReviews || reviews.map(review => this.transformBackendToFrontend(review)))
    );
  }

  /**
   * Helper method to get reviews as Observable (for internal use)
   * @param supplierId Supplier ID
   */
  getReviewsForSupplierObservable(supplierId: string): Observable<SupplierReview[]> {
    return new Observable(observer => {
      this.getReviewsForSupplier(supplierId, (reviews: SupplierReview[]) => {
        observer.next(reviews);
        observer.complete();
      });
    });
  }

  /**
   * Helper method to check if can review as Observable
   * @param supplierId Supplier ID
   * @param businessmanId Businessman ID
   */
  hasBusinessmanReviewedObservable(supplierId: string, businessmanId: string): Observable<boolean> {
    return new Observable(observer => {
      this.hasBusinessmanReviewed(supplierId, businessmanId, (hasReviewed: boolean) => {
        observer.next(hasReviewed);
        observer.complete();
      });
    });
  }

  /**
   * Helper method to calculate average rating as Observable
   * @param supplierId Supplier ID
   */
  calculateAverageRatingObservable(supplierId: string): Observable<{average: number, total: number}> {
    return new Observable(observer => {
      this.calculateAverageRating(supplierId, (average: number, total: number) => {
        observer.next({ average, total });
        observer.complete();
      });
    });
  }
}
