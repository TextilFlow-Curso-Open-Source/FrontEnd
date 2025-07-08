import { Injectable } from '@angular/core';
import { BaseService } from '../../core/services/base.service';
import { Supplier } from '../models/supplier.entity';
import { AuthService } from '../../auth/services/auth.service';
import { environment } from '../../../environments/environment';
import { map, Observable, retry, catchError, throwError } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SupplierService extends BaseService<Supplier> {
  constructor(private authService: AuthService) {
    super();
    this.resourceEndpoint = environment.supplierEndpointPath;
  }

  /**
   * ELIMINADO: createProfile() - Ya no se usa
   * El perfil se crea automáticamente en AuthService cuando se selecciona rol
   */

  /**
   * Obtiene el perfil de proveedor por ID de usuario
   */
  getProfileByUserId(userId: string): Observable<Supplier> {
    return this.customRequest<any>(`/suppliers/${userId}`, 'GET').pipe(
      map(response => {
        const currentUser = this.authService.getCurrentUser();
        return this.transformBackendToFrontend(response, currentUser);
      })
    );
  }

  /**
   * Actualiza el perfil de un proveedor
   */
  updateProfile(userId: string, profile: Supplier): Observable<Supplier> {
    const updateRequest = {
      // Campos de empresa
      companyName: profile.companyName,
      ruc: profile.ruc,
      specialization: profile.specialization,
      description: profile.description,
      certifications: profile.certifications,

      // Datos personales
      name: profile.name,
      email: profile.email,
      country: profile.country,
      city: profile.city,
      address: profile.address,
      phone: profile.phone
    };

    return this.customRequest<any>(`/suppliers/${userId}`, 'PUT', updateRequest).pipe(
      map(response => this.transformBackendToFrontend(response, null))
    );
  }

  /**
   * Transforma respuesta del backend al formato del frontend
   */
  /**
   * Transforma respuesta del backend al formato del frontend
   */
  private transformBackendToFrontend(backendResponse: any, currentUser: any): Supplier {
    const user = currentUser || this.authService.getCurrentUser();

    return new Supplier({
      // 🔧 CORRECCIÓN: Usar SIEMPRE backendResponse.userId como ID
      // El currentUser es el businessman logueado, NO el supplier que estamos procesando
      id: backendResponse.userId?.toString() || backendResponse.id?.toString(),

      // Datos personales: Priorizar backend, luego currentUser
      name: backendResponse.name || user?.name || '',
      email: backendResponse.email || user?.email || '',
      role: 'supplier',
      country: backendResponse.country || user?.country || '',
      city: backendResponse.city || user?.city || '',
      address: backendResponse.address || user?.address || '',
      phone: backendResponse.phone || user?.phone || '',

      // Datos de empresa: Solo campos que existen en el backend
      companyName: backendResponse.companyName || '',
      ruc: backendResponse.ruc || '',
      specialization: backendResponse.specialization || '',
      description: backendResponse.description || '',
      logo: backendResponse.logoUrl || '',
      certifications: backendResponse.certifications || ''
    });
  }

  /**
   * Obtiene todos los proveedores
   */
  getAllSuppliers(): Observable<Supplier[]> {
    return this.customRequest<any[]>(`/suppliers`, 'GET').pipe(
      map(responses => responses.map(response =>
        this.transformBackendToFrontend(response, null)
      ))
    );
  }

  /**
   * Obtiene el perfil de proveedor por email
   */
  getProfileByEmail(email: string): Observable<Supplier | undefined> {
    return this.getAllSuppliers().pipe(
      map(suppliers => suppliers.find(s => s.email === email))
    );
  }

  /**
   * Obtiene el perfil de proveedor por ID
   */
  getProfileById(id: string): Observable<Supplier> {
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
   * Sube logo del proveedor
   */
  uploadLogo(userId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    const endpoint = `${environment.profileEndpointPath}/${userId}/images/logo`;

    // Usar método específico para archivos
    return this.uploadFile(endpoint, formData);
  }

  /**
   * Elimina logo del proveedor
   */
  deleteLogo(userId: string): Observable<any> {
    const endpoint = `${environment.profileEndpointPath}/${userId}/images/logo`;
    return this.customRequest<any>(endpoint, 'DELETE');
  }
}
