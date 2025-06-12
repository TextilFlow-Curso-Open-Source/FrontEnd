// src/app/batch/services/batch.service.service.ts

import { Injectable } from '@angular/core';
import { BaseService } from '../../core/services/base.service.service';
import { Batch } from '../models/batch.entity';
import { catchError, retry } from 'rxjs';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BatchService extends BaseService<Batch> {
  constructor() {
    super();
    // Aquí defines el endpoint específico para los lotes
    this.resourceEndpoint = environment.batchesEndpointPath;
  }

  /**
   * Obtiene los lotes creados por un proveedor específico
   * @param supplierId ID del proveedor (ahora string)
   * @returns Observable con los lotes filtrados
   */
  getBySupplierId(supplierId: string) { // CAMBIO: number → string
    return this.http.get<Batch[]>(
      `${this.serverBaseUrl}${this.resourceEndpoint}?supplierId=${supplierId}`,
      this.httpOptions
    ).pipe(
      retry(2),
      catchError(this.handleError)
    );
  }

  /**
   * Sobrescribe el método update para aceptar actualizaciones parciales
   * @param id ID del lote (ahora string)
   * @param resource Datos parciales del lote a actualizar
   */
  override update(id: string, resource: Partial<Batch>) { // CAMBIO: any → string
    return this.http.put<Batch>(
      `${this.resourcePath()}/${id}`,
      JSON.stringify(resource),
      this.httpOptions
    ).pipe(
      retry(2),
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene los lotes asignados a un empresario específico
   * @param businessmanId ID del empresario
   * @returns Observable con los lotes filtrados
   */
  getByBusinessmanId(businessmanId: string) {
    return this.http.get<Batch[]>(
      `${this.serverBaseUrl}${this.resourceEndpoint}?businessmanId=${businessmanId}`,
      this.httpOptions
    ).pipe(
      retry(2),
      catchError(this.handleError)
    );
  }
}
