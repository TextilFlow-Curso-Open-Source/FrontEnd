// src/app/batch/services/batch.service.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, map, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Batch } from '../models/batch.entity';

@Injectable({
  providedIn: 'root'
})
export class BatchService {
  private serverBaseUrl: string = environment.serverBaseUrl;
  private resourceEndpoint: string = environment.batchesEndpointPath;
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private httpClient: HttpClient) {}

  /**
   * Crear un nuevo batch
   */
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
  ): Observable<Batch> {
    const newBatch = {
      code,
      client,
      businessmanId: parseInt(businessmanId),
      supplierId: parseInt(supplierId),
      fabricType,
      color,
      price: Number(price),
      quantity: Number(quantity),
      observations,
      address,
      date,
      status: 'PENDIENTE',
      imageUrl: imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'
    };

    console.log('🚀 Enviando batch al backend:', newBatch);

    return this.httpClient.post<any>(`${this.serverBaseUrl}${this.resourceEndpoint}`, newBatch, this.httpOptions)
      .pipe(
        map(response => {
          console.log('✅ Respuesta del backend:', response);
          return this.transformFromBackend(response);
        }),
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Obtener todos los batches
   */
  getAllBatches(): Observable<Batch[]> {
    return this.httpClient.get<any[]>(`${this.serverBaseUrl}${this.resourceEndpoint}`, this.httpOptions)
      .pipe(
        map(responses => responses.map(response => this.transformFromBackend(response))),
        catchError(this.handleError)
      );
  }

  /**
   * Obtener batch por ID
   */
  getBatchById(id: string): Observable<Batch> {
    return this.httpClient.get<any>(`${this.serverBaseUrl}${this.resourceEndpoint}/${id}`, this.httpOptions)
      .pipe(
        map(response => this.transformFromBackend(response)),
        catchError(this.handleError)
      );
  }

  /**
   * Obtener batches por supplier ID
   */
  getBySupplierId(supplierId: string): Observable<Batch[]> {
    return this.httpClient.get<any[]>(`${this.serverBaseUrl}/batches/supplier/${supplierId}`, this.httpOptions)
      .pipe(
        map(responses => responses.map(response => this.transformFromBackend(response))),
        catchError(this.handleError)
      );
  }

  /**
   * Obtener batches por businessman ID
   */
  getByBusinessmanId(businessmanId: string): Observable<Batch[]> {
    return this.httpClient.get<any[]>(`${this.serverBaseUrl}/batches/businessman/${businessmanId}`, this.httpOptions)
      .pipe(
        map(responses => responses.map(response => this.transformFromBackend(response))),
        catchError(this.handleError)
      );
  }

  /**
   * ✅ ACTUALIZAR BATCH - VERSIÓN CORREGIDA
   */
// VERSIÓN CORREGIDA DEL updateBatch method en batch.service.service.ts

  /**
   * ✅ MÉTODO updateBatch SIN imageUrl - Solo para datos del batch
   */
  updateBatch(batchId: string, batch: Partial<Batch>): Observable<Batch> {
    console.log('🔄 UpdateBatch - BatchId:', batchId);
    console.log('🔄 UpdateBatch - Batch data:', batch);

    const resourceId = parseInt(batchId);

    return this.getBatchById(batchId).pipe(
      switchMap(existingBatch => {
        // ✅ PREPARAR DATOS SIN imageUrl (se maneja por separado)
        const updateData = {
          batchId: resourceId,
          code: batch.code || existingBatch.code,
          client: batch.client || existingBatch.client,
          businessmanId: Number(batch.businessmanId || existingBatch.businessmanId),
          supplierId: Number(batch.supplierId || existingBatch.supplierId),
          fabricType: batch.fabricType || existingBatch.fabricType,
          color: batch.color || existingBatch.color,
          quantity: Number(batch.quantity || existingBatch.quantity),
          price: Number(batch.price || existingBatch.price),
          observations: batch.observations || existingBatch.observations || '',
          address: batch.address || existingBatch.address || '',
          date: this.formatDateForBackend(batch.date || existingBatch.date),
          status: batch.status || existingBatch.status,
          imageUrl: existingBatch.imageUrl || '' // ✅ Mantener la imagen actual
        };

        console.log('🚀 Sending batch update (without new image):', JSON.stringify(updateData, null, 2));

        return this.httpClient.put<any>(
          `${this.serverBaseUrl}${this.resourceEndpoint}/${resourceId}`,
          updateData,
          this.httpOptions
        );
      }),
      map(response => {
        console.log('✅ Batch update response:', response);
        return this.transformFromBackend(response);
      }),
      catchError(this.handleError)
    );
  }
  uploadBatchImage(batchId: string, file: File): Observable<any> {
    console.log('🖼️ Uploading image for batch:', batchId);

    const formData = new FormData();
    formData.append('file', file);

    const uploadHeaders = new HttpHeaders({
      // No agregar Content-Type para FormData, el navegador lo hace automáticamente
    });

    return this.httpClient.post<any>(
      `${this.serverBaseUrl}${this.resourceEndpoint}/${batchId}/image`,
      formData,
      {
        headers: uploadHeaders,
        reportProgress: true
      }
    ).pipe(
      map(response => {
        console.log('✅ Image upload response:', response);
        return response;
      }),
      catchError(this.handleError)
    );
  }
  private formatDateForBackend(dateString: string): string {
    if (!dateString) return new Date().toISOString().slice(0, 10);

    // Si ya está en formato YYYY-MM-DD, usar tal cual
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;

    // Si viene con tiempo, extraer solo la fecha
    if (dateString.includes('T')) return dateString.split('T')[0];

    // Convertir cualquier otro formato a YYYY-MM-DD
    const date = new Date(dateString);
    return isNaN(date.getTime()) ?
      new Date().toISOString().slice(0, 10) :
      date.toISOString().slice(0, 10);
  }

  /**
   * Eliminar batch
   */
  deleteBatch(batchId: string): Observable<void> {
    const resourceId = parseInt(batchId);

    return this.httpClient.delete<void>(`${this.serverBaseUrl}${this.resourceEndpoint}/${resourceId}`, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Eliminar imagen de batch
   */
  deleteBatchImage(batchId: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.serverBaseUrl}${this.resourceEndpoint}/${batchId}/image`, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  // ============== MÉTODOS DE COMPATIBILIDAD ==============
  getAll(): Observable<Batch[]> {
    return this.getAllBatches();
  }

  findAll(): Observable<Batch[]> {
    return this.getAllBatches();
  }

  getById(id: string): Observable<Batch> {
    return this.getBatchById(id);
  }

  findById(id: string): Observable<Batch> {
    return this.getBatchById(id);
  }

  create(batch: Batch): Observable<Batch> {
    return this.createBatch(
      batch.code,
      batch.client,
      batch.businessmanId,
      batch.supplierId,
      batch.fabricType,
      batch.color,
      batch.price,
      batch.quantity,
      batch.observations || '',
      batch.address || '',
      batch.date,
      batch.imageUrl
    );
  }

  delete(id: string): Observable<void> {
    return this.deleteBatch(id);
  }

  /**
   * Actualizar batch completo (método alternativo)
   */
  update(batchId: string, batch: Batch): Observable<Batch> {
    const resourceId = parseInt(batchId);

    const updateData = {
      code: batch.code,
      client: batch.client,
      businessmanId: parseInt(batch.businessmanId),
      supplierId: parseInt(batch.supplierId),
      fabricType: batch.fabricType,
      color: batch.color,
      quantity: batch.quantity,
      price: batch.price,
      observations: batch.observations || '',
      address: batch.address || '',
      date: batch.date,
      status: batch.status,
      imageUrl: batch.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'
    };

    console.log('🔄 Update full batch:', updateData);

    return this.httpClient.put<any>(`${this.serverBaseUrl}${this.resourceEndpoint}/${resourceId}`, updateData, this.httpOptions)
      .pipe(
        map(response => {
          console.log('✅ Update full response:', response);
          return this.transformFromBackend(response);
        }),
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Transformar datos del backend al frontend
   */
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
      status: backendData.status || 'PENDIENTE',
      createdAt: backendData.createdAt,
      updatedAt: backendData.updatedAt,
      imageUrl: backendData.imageUrl
    });
  }

  /**
   * Manejo de errores mejorado
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'Ocurrió un error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      console.log('🔍 FULL ERROR OBJECT:', error);
      console.log('🔍 ERROR BODY:', error.error);
      console.log('🔍 ERROR STATUS:', error.status);
      console.log('🔍 ERROR HEADERS:', error.headers);

      // Si hay información específica del backend, mostrarla
      if (error.error && typeof error.error === 'object') {
        if (error.error.message) {
          errorMessage = `Backend error: ${error.error.message}`;
        } else if (error.error.details) {
          errorMessage = `Validation error: ${error.error.details}`;
        } else {
          errorMessage = `Server error: ${JSON.stringify(error.error)}`;
        }
      } else {
        switch (error.status) {
          case 400:
            errorMessage = `Bad request (400): ${error.error || 'Revisa los datos enviados'}`;
            break;
          case 401:
            errorMessage = 'No autorizado (401)';
            break;
          case 403:
            errorMessage = 'Acceso prohibido (403)';
            break;
          case 404:
            errorMessage = 'Recurso no encontrado (404)';
            break;
          case 500:
            errorMessage = 'Error interno del servidor (500)';
            break;
          default:
            errorMessage = `Error del servidor: ${error.status} - ${error.message}`;
        }
      }
    }

    console.error('❌ Error en BatchService:', errorMessage);
    console.error('❌ Error completo:', error);

    return throwError(() => new Error(errorMessage));
  };
}
