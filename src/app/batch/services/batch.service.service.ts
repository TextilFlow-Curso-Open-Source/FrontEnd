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
    this.resourceEndpoint = environment.batchesEndpointPath; // 👈 esto coincide con tu backend o json-server
  }

  /**
   * Obtiene los lotes creados por un proveedor específico
   * @param supplierId ID del proveedor
   * @returns Observable con los lotes filtrados
   */
  getBySupplierId(supplierId: number) {
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
   */
  override update(id: any, resource: Partial<Batch>) {
    return this.http.put<Batch>(
      `${this.resourcePath()}/${id}`,
      JSON.stringify(resource),
      this.httpOptions
    ).pipe(
      retry(2),
      catchError(this.handleError)
    );
  }
}
