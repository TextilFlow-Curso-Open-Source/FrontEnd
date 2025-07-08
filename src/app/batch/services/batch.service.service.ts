// src/app/batch/services/batch.service.service.ts

import { Injectable } from '@angular/core';
import { BaseService } from '../../core/services/base.service';
import { Batch } from '../models/batch.entity';
import {catchError, Observable, retry, map} from 'rxjs';
import {environment} from '../../../environments/environment';
import {HttpClient, HttpHeaders} from '@angular/common/http';

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
    console.log('UpdateBatch - BatchId:', batchId);
    console.log('UpdateBatch - Batch data:', batch);
    
    const resourceId = parseInt(batchId);
    
    // Solo enviar los campos que realmente se actualizan
    const updateData: any = {};
    
    if (batch.status !== undefined) {
      updateData.status = batch.status;
    }
    
    if (batch.observations !== undefined) {
      updateData.observations = batch.observations;
    }
    
    // Para la imagen, usar un endpoint separado si es muy grande
    if (batch.imageUrl && !batch.imageUrl.startsWith('data:')) {
      updateData.imageUrl = batch.imageUrl;
    }
    
    console.log('UpdateBatch - Sending data:', updateData);
    
    return this.httpClient.put<any>(`${this.serverBaseUrl}${this.resourceEndpoint}/${resourceId}`, updateData, this.httpOptions)
      .pipe(
        map(response => this.transformFromBackend(response)),
        retry(2),
        catchError(this.handleError)
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
    const result: any = {};
    
    if (batch.id !== undefined) result.id = parseInt(batch.id);
    if (batch.code !== undefined) result.code = batch.code;
    if (batch.client !== undefined) result.client = batch.client;
    if (batch.businessmanId !== undefined) result.businessmanId = parseInt(batch.businessmanId);
    if (batch.supplierId !== undefined) result.supplierId = parseInt(batch.supplierId);
    if (batch.fabricType !== undefined) result.fabricType = batch.fabricType;
    if (batch.color !== undefined) result.color = batch.color;
    if (batch.quantity !== undefined) result.quantity = batch.quantity;
    if (batch.price !== undefined) result.price = batch.price;
    if (batch.observations !== undefined) result.observations = batch.observations;
    if (batch.address !== undefined) result.address = batch.address;
    if (batch.date !== undefined) result.date = batch.date;
    if (batch.status !== undefined) result.status = batch.status;
    if (batch.imageUrl !== undefined) result.imageUrl = batch.imageUrl;
    
    return result;
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

  uploadBatchImage(batchId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.resourceEndpoint}/${batchId}/image`;
    return this.httpClient.post<any>(`${this.serverBaseUrl}${url}`, formData, {
      headers: new HttpHeaders({
        'Authorization': this.httpOptions.headers.get('Authorization') || ''
      }),
      reportProgress: true
    }).pipe(
      catchError(this.handleError)
    );
  }

  deleteBatchImage(batchId: string): Observable<void> {
    return this.customRequest<void>(`${this.resourceEndpoint}/${batchId}/image`, 'DELETE');
  }
}
