// /src/app/businessman/services/businessman.service.ts
import { Injectable } from '@angular/core';
import { BaseService } from '../../core/services/base.service.service';
import { Businessman } from '../models/businessman.entity';
import { AuthService } from '../../auth/services/auth.service';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BusinessmanService extends BaseService<Businessman> {
  constructor(private authService: AuthService) {
    super();
    this.resourceEndpoint = environment.businessmanEndpointPath;
  }

  /**
   * Crea un nuevo perfil de empresario usando el mismo ID del usuario
   * @param userId ID del usuario (será el mismo ID para el businessman)
   */
  createProfile(userId: string) {
    const currentUser = this.authService.getCurrentUser();

    console.log('Usuario actual obtenido en BusinessmanService:', currentUser);
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

    // Crear Businessman con herencia completa usando el MISMO ID
    const newBusinessman = new Businessman({
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      password: currentUser.password,
      role: 'businessman',
      country: currentUser.country,
      city: currentUser.city,
      address: currentUser.address,
      phone: currentUser.phone,
      companyName: "",
      ruc: "",
      businessType: "",
      industry: "",
      employeeCount: 0,
      foundingYear: new Date().getFullYear(),
      website: "",
      description: "",
      logo: ""
    });

    console.log('Businessman a crear:', newBusinessman);
    return this.create(newBusinessman);
  }

  /**
   * Obtiene todos los empresarios
   */
  getAllBusinessmen() {
    return this.getAll();
  }

  /**
   * Obtiene el perfil de empresario por email
   */
  getProfileByEmail(email: string) {
    return this.getAll().pipe(
      map(businessmen => businessmen.find(b => b.email === email))
    );
  }

  /**
   * Obtiene el perfil de empresario por ID
   */
  getProfileById(id: string) {
    return this.getById(id);
  }

  /**
   * Obtiene el perfil de empresario por ID de usuario (alias para compatibilidad)
   */
  getProfileByUserId(userId: string) {
    return this.getProfileById(userId);
  }

  /**
   * Actualiza el perfil de un empresario
   */
  updateProfile(id: string, profile: Businessman) {
    return this.update(id, profile);
  }
}
