// /src/app/supplier/services/supplier.service.ts
import { Injectable } from '@angular/core';
import { BaseService } from '../../core/services/base.service.service';
import { Supplier } from '../models/supplier.entity'; // Cambié entity por model para coincidir con tus archivos
import { environment } from '../../../environments/environment';

/**
 * API endpoint path for suppliers obtained from environment configuration.
 */
const supplierResourceEndpointPath = environment.supplierEndpointPath;

/**
 * Service responsible for managing supplier-related operations.
 */
@Injectable({
  providedIn: 'root'
})
export class SupplierService extends BaseService<Supplier> {
  constructor() {
    super();
    this.resourceEndpoint = supplierResourceEndpointPath;
  }

  /**
   * Crea un nuevo perfil de proveedor asociado a un usuario existente
   * @param userId ID del usuario al que se asociará el perfil
   */
  createProfile(userId: number): void {
    const newSupplier = {
      userId: userId,
      companyName: "",
      ruc: "",
      specialization: "",
      productCategories: [],
      yearsFounded: new Date().getFullYear(),
      warehouseLocation: "",
      minimumOrderQuantity: 0,
      logo: ""
    };

    this.http.post(`${this.serverBaseUrl}${this.resourceEndpoint}`, newSupplier)
      .subscribe({
        next: (response) => console.log('Perfil de proveedor creado:', response),
        error: (error) => console.error('Error al crear perfil de proveedor:', error)
      });
  }

  /**
   * Obtiene el perfil de proveedor asociado a un ID de usuario
   * @param userId ID del usuario cuyo perfil se quiere obtener
   */
  getProfileByUserId(userId: number, callback?: Function): void {
    this.http.get<Supplier[]>(`${this.serverBaseUrl}${this.resourceEndpoint}?userId=${userId}`)
      .subscribe({
        next: (profiles) => {
          const profile = profiles && profiles.length > 0 ? profiles[0] : null;
          if (callback) {
            callback(profile);
          }
        },
        error: (error) => {
          console.error('Error al obtener perfil de proveedor:', error);
          if (callback) {
            callback(null);
          }
        }
      });
  }
}
