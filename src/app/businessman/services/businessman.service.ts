// /src/app/businessman/services/businessman.service.ts
import { Injectable } from '@angular/core';
import { BaseService } from '../../core/services/base.service.service';
import { Businessman } from '../models/businessman.entity'; // Cambié entity por model para coincidir con tus archivos
import { environment } from '../../../environments/environment';
import { Observable, map } from 'rxjs';

/**
 * API endpoint path for businessmen obtained from environment configuration.
 */
const businessmanResourceEndpointPath = environment.businessmanEndpointPath;

/**
 * Service responsible for managing businessman-related operations.
 */
@Injectable({
  providedIn: 'root'
})
export class BusinessmanService extends BaseService<Businessman> {
  constructor() {
    super();
    this.resourceEndpoint = businessmanResourceEndpointPath;
  }

  /**
   * Crea un nuevo perfil de empresario asociado a un usuario existente
   * @param userId ID del usuario al que se asociará el perfil
   */
  createProfile(userId: number): void {
    const newBusinessman = {
      userId: userId,
      companyName: "",
      ruc: "",
      businessType: "",
      industry: "",
      employeeCount: 0,
      foundingYear: new Date().getFullYear(),
      website: "",
      description: "",
      logo: ""
    };

    this.http.post(`${this.serverBaseUrl}${this.resourceEndpoint}`, newBusinessman)
      .subscribe({
        next: (response) => console.log('Perfil de empresario creado:', response),
        error: (error) => console.error('Error al crear perfil de empresario:', error)
      });
  }

  /**
   * Obtiene el perfil de empresario asociado a un ID de usuario
   * @param userId ID del usuario cuyo perfil se quiere obtener
   */
  getProfileByUserId(userId: number, callback?: Function): void {
    this.http.get<Businessman[]>(`${this.serverBaseUrl}${this.resourceEndpoint}?userId=${userId}`)
      .subscribe({
        next: (profiles) => {
          const profile = profiles && profiles.length > 0 ? profiles[0] : null;
          if (callback) {
            callback(profile);
          }
        },
        error: (error) => {
          console.error('Error al obtener perfil de empresario:', error);
          if (callback) {
            callback(null);
          }
        }
      });
  }

  /**
   * Obtiene el perfil de empresario asociado a un ID de usuario como Observable
   * @param userId ID del usuario cuyo perfil se quiere obtener
   * @returns Observable con el perfil de empresario
   */
  getProfileByUserIdObservable(userId: number): Observable<Businessman | null> {
    return this.http.get<Businessman[]>(`${this.serverBaseUrl}${this.resourceEndpoint}?userId=${userId}`)
      .pipe(
        map(profiles => profiles && profiles.length > 0 ? profiles[0] : null)
      );
  }

  /**
   * Actualiza el perfil de un empresario
   * @param id ID del perfil a actualizar
   * @param profile Datos actualizados del perfil
   * @returns Observable con el perfil actualizado
   */
  updateProfile(id: number, profile: Businessman): Observable<Businessman> {
    return this.update(id, profile);
  }
}
