// /src/app/businessman/services/supplier-request-service.service.ts
import { Injectable } from '@angular/core';
import { BaseService } from '../../core/services/base.service.service';
import { BusinessSupplierRequest} from '../model/business-supplier-request.entity';
import {environment} from '../../../environments/environment';
/**
 * Service responsible for managing business-supplier connection requests.
 */
@Injectable({
  providedIn: 'root'
})
export class SupplierRequestService extends BaseService<BusinessSupplierRequest> {
  constructor() {
    super();
    this.resourceEndpoint = environment.businessSupplierRequests;
  }

  /**
   * Crea una nueva solicitud de conexión con un proveedor
   * @param businessmanId ID del empresario que envía la solicitud
   * @param supplierId ID del proveedor al que se envía la solicitud
   * @param message Mensaje opcional
   * @param batchType Tipo de tela/lote (opcional)
   * @param color Color de la tela (opcional)
   * @param quantity Cantidad (opcional)
   * @param address Dirección de entrega (opcional)
   */
  createRequest(
    businessmanId: number,
    supplierId: number,
    message?: string,
    batchType?: string,
    color?: string,
    quantity?: number | null, // Modificado: ahora acepta null
    address?: string
  ): any {
    const newRequest: BusinessSupplierRequest = {
      businessmanId,
      supplierId,
      status: 'pending',
      message,
      batchType,
      color,
      quantity: quantity ?? undefined, // Convertir null a undefined
      address,
      createdAt: new Date().toISOString()
    };

    return this.create(newRequest);
  }

  /**
   * Obtiene solicitudes enviadas por un empresario
   * @param businessmanId ID del empresario
   * @param callback Función de retorno con la lista de solicitudes
   */
  getRequestsByBusinessman(businessmanId: number, callback: Function): void {
    this.http.get<BusinessSupplierRequest[]>(
      `${this.serverBaseUrl}${this.resourceEndpoint}?businessmanId=${businessmanId}`
    ).subscribe({
      next: (requests) => {
        callback(requests);
      },
      error: (error) => {
        console.error('Error al obtener solicitudes del empresario:', error);
        callback([]);
      }
    });
  }

  /**
   * Obtiene solicitudes recibidas por un proveedor
   * @param supplierId ID del proveedor
   */
  getRequestsForSupplier(supplierId: number): any {
    return this.http.get<BusinessSupplierRequest[]>(
      `${this.serverBaseUrl}${this.resourceEndpoint}?supplierId=${supplierId}`
    );
  }

  /**
   * Actualiza el estado de una solicitud
   * @param requestId ID de la solicitud
   * @param status Nuevo estado ('accepted' o 'rejected')
   */
  updateRequestStatus(requestId: number, status: 'accepted' | 'rejected'): any {
    return this.http.patch<BusinessSupplierRequest>(
      `${this.serverBaseUrl}${this.resourceEndpoint}/${requestId}`,
      {
        status,
        updatedAt: new Date().toISOString()
      }
    );
  }

  /**
   * Verifica si ya existe una solicitud activa (no rechazada) entre un empresario y un proveedor
   * @param businessmanId ID del empresario
   * @param supplierId ID del proveedor
   */
  checkExistingRequest(businessmanId: number, supplierId: number): any {
    return this.http.get<BusinessSupplierRequest[]>(
      `${this.serverBaseUrl}${this.resourceEndpoint}?businessmanId=${businessmanId}&supplierId=${supplierId}&status_ne=rejected`
    );
  }
}
