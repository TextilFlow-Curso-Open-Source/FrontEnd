import { Injectable } from '@angular/core';
import { Observation } from '../models/observation.entity';
import { environment } from '../../../environments/environment';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {catchError, Observable} from 'rxjs';
import { BaseService } from '../../core/services/base.service';

@Injectable({
  providedIn: 'root'
})
export class ObservationService extends BaseService<Observation> {
  constructor() {
    super();
    this.serverBaseUrl = environment.serverBaseUrl;
    this.resourceEndpoint = environment.observationEndpointPath;
  }

  getBySupplierId(supplierId: string): Observable<Observation[]> {
    return this.customRequest<Observation[]>(`${this.resourceEndpoint}/supplier/${supplierId}`, 'GET');
  }

  getByBusinessmanId(businessmanId: string): Observable<Observation[]> {
    return this.customRequest<Observation[]>(`${this.resourceEndpoint}/businessman/${businessmanId}`, 'GET');
  }

  getByBatchId(batchId: string): Observable<Observation[]> {
    return this.customRequest<Observation[]>(`${this.resourceEndpoint}/batch/${batchId}`, 'GET');
  }

  uploadObservationImage(observationId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    // Usamos customRequest pero necesitamos sobrescribir las opciones HTTP
    const url = `${this.resourceEndpoint}/${observationId}/images`;
    return this.http.post<any>(`${this.serverBaseUrl}${url}`, formData, {
      headers: new HttpHeaders({
        // No incluimos Content-Type para que el navegador lo establezca con el boundary correcto
        'Authorization': this.httpOptions.headers.get('Authorization') || ''
      }),
      reportProgress: true
    }).pipe(
      catchError(this.handleError)
    );
  }

  deleteObservationImage(observationId: number): Observable<void> {
    return this.customRequest<void>(`${this.resourceEndpoint}/${observationId}/images`, 'DELETE');
  }
}
