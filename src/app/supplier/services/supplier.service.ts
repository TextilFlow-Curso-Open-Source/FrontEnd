// /src/app/supplier/services/supplier.service.ts
import { Injectable } from '@angular/core';
import { BaseService } from '../../core/services/base.service.service';
import { Supplier} from '../models/supplier.entity';
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
      logo: "",
      averageRating: 0,
      totalReviews: 0
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

  /**
   * Obtiene todos los usuarios con rol de proveedor
   * @param callback Función de retorno con la lista de proveedores
   */
  getAllSuppliers(callback: Function): void {
    this.http.get<any[]>(`${this.serverBaseUrl}/users?role=supplier`)
      .subscribe({
        next: (suppliers) => {
          callback(suppliers);
        },
        error: (error) => {
          console.error('Error al obtener proveedores:', error);
          callback([]);
        }
      });
  }

  /**
   * Busca proveedores por correo electrónico
   * @param email Correo electrónico a buscar
   * @param callback Función de retorno con los resultados
   */
  findSupplierByEmail(email: string, callback: Function): void {
    this.http.get<any[]>(`${this.serverBaseUrl}/users?role=supplier&email_like=${email}`)
      .subscribe({
        next: (suppliers) => {
          callback(suppliers);
        },
        error: (error) => {
          console.error('Error al buscar proveedores:', error);
          callback([]);
        }
      });
  }

  /**
   * Obtiene detalles completos de un proveedor (usuario + perfil)
   * @param userId ID del usuario proveedor
   * @param callback Función de retorno con los detalles completos
   */
  getSupplierDetails(userId: number, callback: Function): void {
    this.http.get<any>(`${this.serverBaseUrl}/users/${userId}`)
      .subscribe({
        next: (user) => {
          this.getProfileByUserId(userId, (profile: any) => {
            const supplierDetails = { ...user, profile };
            callback(supplierDetails);
          });
        },
        error: (error) => {
          console.error('Error al obtener detalles del proveedor:', error);
          callback(null);
        }
      });
  }

  /**
   * Actualiza el rating promedio de un proveedor
   * @param supplierId ID del proveedor
   * @param averageRating Rating promedio
   * @param totalReviews Número total de reseñas
   */
  updateSupplierRating(supplierId: number, averageRating: number, totalReviews: number): void {
    this.getProfileByUserId(supplierId, (profile: any) => {
      if (!profile) {
        console.error('No se encontró el perfil del proveedor');
        return;
      }

      const updatedProfile = {
        ...profile,
        averageRating,
        totalReviews
      };

      this.http.patch(`${this.serverBaseUrl}${this.resourceEndpoint}/${profile.id}`, updatedProfile)
        .subscribe({
          next: (response) => console.log('Rating actualizado:', response),
          error: (error) => console.error('Error al actualizar rating:', error)
        });
    });
  }

  /**
   * Actualiza el perfil de un proveedor
   * @param id ID del perfil a actualizar
   * @param profile Datos actualizados del perfil
   */
  updateProfile(id: number, profile: Supplier): any {
    return this.update(id, profile);
  }
}
