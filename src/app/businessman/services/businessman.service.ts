import { Injectable } from '@angular/core';
import { BaseService } from '../../core/services/base.service';
import { Businessman } from '../models/businessman.entity';
import { AuthService } from '../../auth/services/auth.service';
import { environment } from '../../../environments/environment';
import { map, Observable, retry, catchError, throwError } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class BusinessmanService extends BaseService<Businessman> {
  constructor(private authService: AuthService) {
    super();
    this.resourceEndpoint = environment.businessmanEndpointPath;
  }

  /**
   * Obtiene el perfil de empresario por ID de usuario
   */
  getProfileByUserId(userId: string): Observable<Businessman> {
    return this.customRequest<any>(`/businessmen/${userId}`, 'GET').pipe(
      map(response => {
        const currentUser = this.authService.getCurrentUser();
        return this.transformBackendToFrontend(response, currentUser);
      })
    );
  }

  /**
   * Actualiza el perfil de un empresario
   */
  updateProfile(userId: string, profile: Businessman): Observable<Businessman> {
    const updateRequest = {
      // Campos de empresa
      companyName: profile.companyName,
      ruc: profile.ruc,
      businessType: profile.businessType,
      description: profile.description,
      website: profile.website,

      // Datos personales
      name: profile.name,
      email: profile.email,
      country: profile.country,
      city: profile.city,
      address: profile.address,
      phone: profile.phone
    };

    return this.customRequest<any>(`/businessmen/${userId}`, 'PUT', updateRequest).pipe(
      map(response => this.transformBackendToFrontend(response, null))
    );
  }

  /**
   * Transforma respuesta del backend al formato del frontend
   */
  private transformBackendToFrontend(backendResponse: any, currentUser: any): Businessman {
    const user = currentUser || this.authService.getCurrentUser();

    return new Businessman({
      // Datos personales: Priorizar backend, luego currentUser
      id: user?.id || backendResponse.userId?.toString(),
      name: backendResponse.name || user?.name || '',
      email: backendResponse.email || user?.email || '',
      role: 'businessman',
      country: backendResponse.country || user?.country || '',
      city: backendResponse.city || user?.city || '',
      address: backendResponse.address || user?.address || '',
      phone: backendResponse.phone || user?.phone || '',

      // Datos de empresa: Solo campos que existen en el backend
      companyName: backendResponse.companyName || '',
      ruc: backendResponse.ruc || '',
      businessType: backendResponse.businessType || '',
      website: backendResponse.website || '',
      description: backendResponse.description || '',
      logo: backendResponse.logoUrl || ''
    });
  }

  /**
   * Obtiene todos los empresarios
   */
  getAllBusinessmen(): Observable<Businessman[]> {
    return this.customRequest<any[]>(`/businessmen`, 'GET').pipe(
      map(responses => responses.map(response =>
        this.transformBackendToFrontend(response, null)
      ))
    );
  }

  /**
   * Obtiene el perfil de empresario por email
   */
  getProfileByEmail(email: string): Observable<Businessman | undefined> {
    return this.getAllBusinessmen().pipe(
      map(businessmen => businessmen.find(b => b.email === email))
    );
  }

  /**
   * Obtiene el perfil de empresario por ID
   */
  getProfileById(id: string): Observable<Businessman> {
    return this.getProfileByUserId(id);
  }

  /**
   * Método específico para subir archivos (sin Content-Type JSON)
   */
  private uploadFile(endpoint: string, formData: FormData): Observable<any> {
    const url = `${this.serverBaseUrl}${endpoint}`;

    // Crear headers SOLO con Authorization (sin Content-Type)
    let headers = new HttpHeaders();
    const token = localStorage.getItem('auth_token');
    if (token && !token.startsWith('fake-jwt-token-') && !token.startsWith('temp-jwt-token-')) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    // HttpClient con headers específicos para FormData
    return this.http.post<any>(url, formData, { headers }).pipe(
      retry(2),
      catchError((error) => {
        return throwError(() => new Error(`Upload error: ${error.status}`));
      })
    );
  }

  /**
   * Sube logo del empresario
   */
  uploadLogo(userId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    const endpoint = `${environment.profileEndpointPath}/${userId}/images/logo`;

    // Usar método específico para archivos
    return this.uploadFile(endpoint, formData);
  }

  /**
   * Elimina logo del empresario
   */
  deleteLogo(userId: string): Observable<any> {
    const endpoint = `${environment.profileEndpointPath}/${userId}/images/logo`;
    return this.customRequest<any>(endpoint, 'DELETE');
  }
}
