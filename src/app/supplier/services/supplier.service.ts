// /src/app/supplier/services/supplier.service.ts
import { Injectable } from '@angular/core';
import { BaseService } from '../../core/services/base.service.service';
import { Supplier } from '../models/supplier.entity';
import { AuthService } from '../../auth/services/auth.service';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SupplierService extends BaseService<Supplier> {
  constructor(private authService: AuthService) {
    super();
    this.resourceEndpoint = environment.supplierEndpointPath;
  }

  /**
   * Crea un nuevo perfil de proveedor usando el mismo ID del usuario
   * @param userId ID del usuario (será el mismo ID para el supplier)
   */
  createProfile(userId: string) {
    const currentUser = this.authService.getCurrentUser();

    console.log('Usuario actual obtenido en SupplierService:', currentUser);
    console.log('UserID esperado:', userId);

    if (!currentUser) {
      console.error('No hay usuario autenticado en el sistema');
      throw new Error('No hay usuario autenticado en el sistema');
    }

    if (currentUser.id !== userId) {
      console.warn(`ID de usuario no coincide. Actual: ${currentUser.id}, Esperado: ${userId}`);
      if (!currentUser.id) {
        throw new Error('El usuario actual no tiene ID asignado');
      }
    }

    // Crear Supplier con herencia completa usando el MISMO ID
    const newSupplier = new Supplier({
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      password: currentUser.password,
      role: 'supplier',
      country: currentUser.country,
      city: currentUser.city,
      address: currentUser.address,
      phone: currentUser.phone,
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
    });

    console.log('Supplier a crear:', newSupplier);
    return this.create(newSupplier);
  }

  /**
   * Obtiene todos los proveedores
   */
  getAllSuppliers() {
    return this.getAll();
  }

  /**
   * Obtiene el perfil de proveedor por email
   */
  getProfileByEmail(email: string) {
    return this.getAll().pipe(
      map(suppliers => suppliers.find(s => s.email === email))
    );
  }

  /**
   * Obtiene el perfil de proveedor por ID
   */
  getProfileById(id: string) {
    return this.getById(id);
  }

  /**
   * Obtiene el perfil de proveedor por ID de usuario (alias para compatibilidad)
   */
  getProfileByUserId(userId: string) {
    return this.getProfileById(userId);
  }

  /**
   * Actualiza el perfil de un proveedor
   */
  updateProfile(id: string, profile: Supplier) {
    return this.update(id, profile);
  }

  /**
   * Actualiza el rating promedio de un proveedor
   */
  updateSupplierRating(supplierId: string, averageRating: number, totalReviews: number) {
    return this.getById(supplierId).pipe(
      map(supplier => {
        // Aquí podrías implementar la lógica de actualización del rating
        supplier.averageRating = averageRating;
        supplier.totalReviews = totalReviews;
        return supplier;
      })
    );
  }
}
