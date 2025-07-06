import { Injectable } from '@angular/core';
import { BaseService } from '../../core/services/base.service';
import { BusinessSupplierRequest } from '../model/business-supplier-request.entity';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Service responsible for managing business-supplier connection requests.
 */
@Injectable({
  providedIn: 'root'
})
export class SupplierRequestService extends BaseService<BusinessSupplierRequest> {
  constructor(private httpClient: HttpClient) {
    super();
    this.resourceEndpoint = environment.businessSupplierRequests;
  }

  /**
   * Crea una nueva solicitud de conexión con un proveedor
   */
  createRequest(
    businessmanId: string,
    supplierId: string,
    message?: string,
    batchType?: string,
    color?: string,
    quantity?: number | null,
    address?: string
  ): Observable<BusinessSupplierRequest> {
    const newRequest: BusinessSupplierRequest = {
      businessmanId,
      supplierId,
      status: 'pending',
      message,
      batchType,
      color,
      quantity: quantity ?? undefined,
      address,
      createdAt: new Date().toISOString()
    };

    return this.httpClient.post<BusinessSupplierRequest>(
      `${this.serverBaseUrl}${this.resourceEndpoint}`,
      newRequest
    );
  }

  /**
   * Obtiene solicitudes enviadas por un empresario
   */
  getRequestsByBusinessman(businessmanId: string): Observable<BusinessSupplierRequest[]> {
    return this.httpClient.get<BusinessSupplierRequest[]>(
      `${this.serverBaseUrl}${this.resourceEndpoint}/businessman/${businessmanId}`
    );
  }

  /**
   * Obtiene solicitudes recibidas por un proveedor
   */
  getRequestsForSupplier(supplierId: string): Observable<BusinessSupplierRequest[]> {
    return this.httpClient.get<BusinessSupplierRequest[]>(
      `${this.serverBaseUrl}${this.resourceEndpoint}/supplier/${supplierId}`
    );
  }

  /**
   * Actualiza el estado de una solicitud ('accepted' o 'rejected')
   */
  updateRequestStatus(requestId: string, status: 'accepted' | 'rejected'): Observable<BusinessSupplierRequest> {
    return this.httpClient.put<BusinessSupplierRequest>(
      `${this.serverBaseUrl}${this.resourceEndpoint}/${requestId}/status`,
      { status }
    );
  }

  /**
   * Verifica si ya existe una solicitud activa (no rechazada) entre un empresario y un proveedor
   */
  checkExistingRequest(businessmanId: string, supplierId: string): Observable<BusinessSupplierRequest[]> {
    return this.httpClient.get<BusinessSupplierRequest[]>(
      `${this.serverBaseUrl}${this.resourceEndpoint}?businessmanId=${businessmanId}&supplierId=${supplierId}&status_ne=rejected`
    );
  }

  /**
   * Obtiene todas las solicitudes (solo si eres admin o lo necesitas)
   */
  getAllRequests(): Observable<BusinessSupplierRequest[]> {
    return this.httpClient.get<BusinessSupplierRequest[]>(
      `${this.serverBaseUrl}${this.resourceEndpoint}`
    );
  }

  /**
   * Obtiene una solicitud por su ID
   */
  getRequestById(requestId: string): Observable<BusinessSupplierRequest> {
    return this.httpClient.get<BusinessSupplierRequest>(
      `${this.serverBaseUrl}${this.resourceEndpoint}/${requestId}`
    );
  }
}
