// src/app/batch/services/batch.service.service.ts

import { Injectable } from '@angular/core';
import { BaseService } from '../../core/services/base.service';
import { Batch } from '../models/batch.entity';
import {catchError, Observable, retry, map} from 'rxjs';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class BatchService extends BaseService<Batch> {
  constructor(private httpClient: HttpClient) {
    super();
    // Aquí defines el endpoint específico para los lotes
    this.resourceEndpoint = environment.batchesEndpointPath;
  }


  createBatch(
    code: string,
    client: string,
    businessmanId: string,
    supplierId: string,
    fabricType: string,
    color: string,
    price: number,
    quantity: number,
    observations: string,
    address: string,
    date: string,
    imageUrl?: string
  ) : Observable<Batch> {
    const newBatch: Batch = {
      code,
      client,
      businessmanId,
      supplierId,
      fabricType,
      color,
      price,
      quantity,
      observations,
      address,
      date,
      status: 'Pendiente',
      imageUrl,
      createdAt : new Date().toISOString()
    };

    const backendData = this.transformToBackend(newBatch);
    return this.httpClient.post<any>(`${this.serverBaseUrl}${this.resourceEndpoint}`, backendData, this.httpOptions)
      .pipe(
        map(response => this.transformFromBackend(response)),
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Obtiene los lotes creados por un proveedor específico
   * @param supplierId ID del proveedor (ahora string)
   * @returns Observable con los lotes filtrados
   */
  getBySupplierId(supplierId: string): Observable<Batch[]> {
    return this.customRequest<any[]>(`/batches?supplierId=${supplierId}`, 'GET').pipe(
      map(responses => responses.map(response => this.transformFromBackend(response)))
    );
  }

  updateBatch(batchId: string, batch: Partial<Batch>): Observable<Batch> {
    const updateRequest = {
      status: batch.status,
      observations: batch.observations,
      imageUrl: batch.imageUrl
    };

    return this.customRequest<any>(`/batches/${batchId}`, 'PUT', updateRequest).pipe(
      map(response => this.transformFromBackend(response))
    );
  }

  /**
   * Obtiene los lotes asignados a un empresario específico
   * @param businessmanId ID del empresario
   * @returns Observable con los lotes filtrados
   */
  getByBusinessmanId(businessmanId: string): Observable<Batch[]> {
    return this.customRequest<any[]>(`/batches?businessmanId=${businessmanId}`, 'GET').pipe(
      map(responses => responses.map(response => this.transformFromBackend(response)))
    );
  }

  private transformToBackend(batch: Partial<Batch>): any {
    return {
      id: batch.id ? parseInt(batch.id) : undefined,
      code: batch.code,
      client: batch.client,
      businessmanId: batch.businessmanId ? parseInt(batch.businessmanId) : undefined,
      supplierId: batch.supplierId ? parseInt(batch.supplierId) : undefined,
      fabricType: batch.fabricType,
      color: batch.color,
      quantity: batch.quantity,
      price: batch.price,
      observations: batch.observations,
      address: batch.address,
      date: batch.date,
      status: batch.status,
      imageUrl: batch.imageUrl
    };
  }

  private transformFromBackend(backendData: any): Batch {
    return new Batch({
      id: backendData.id?.toString(),
      code: backendData.code || '',
      client: backendData.client || '',
      businessmanId: backendData.businessmanId?.toString() || '',
      supplierId: backendData.supplierId?.toString() || '',
      fabricType: backendData.fabricType || '',
      color: backendData.color || '',
      quantity: backendData.quantity || 0,
      price: backendData.price || 0,
      observations: backendData.observations || '',
      address: backendData.address || '',
      date: backendData.date || new Date().toISOString(),
      status: backendData.status || 'Pendiente',
      createdAt: backendData.createdAt,
      updatedAt: backendData.updatedAt,
      imageUrl: backendData.imageUrl
    });
  }

  /**
   * Transforma datos de batch del backend al frontend
   */
  transformBatchBackendToFrontend(backendData: any): Batch {
    return new Batch({
      id: backendData.id?.toString(),
      code: backendData.code || '',
      client: backendData.client || '',
      businessmanId: backendData.businessmanId?.toString() || '',
      supplierId: backendData.supplierId?.toString() || '',
      fabricType: backendData.fabricType || '',
      color: backendData.color || '',
      quantity: backendData.quantity || 0,
      price: backendData.price || 0,
      observations: backendData.observations || '',
      address: backendData.address || '',
      date: backendData.date || new Date().toISOString(),
      status: backendData.status || 'Pendiente',
      createdAt: backendData.createdAt,
      updatedAt: backendData.updatedAt,
      imageUrl: backendData.imageUrl
    });
  }
}
