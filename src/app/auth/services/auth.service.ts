// /src/app/auth/services/auth.service.ts
import { Injectable, OnInit } from '@angular/core';
import { BaseService } from '../../core/services/base.service.service';
import { User } from '../models/user.entity';
import { Router } from '@angular/router';
import { SessionService } from './session.service';
import { BusinessmanService } from '../../businessman/services/businessman.service';
import { SupplierService } from '../../supplier/services/supplier.service';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService extends BaseService<User> implements OnInit {
  constructor(
    private router: Router,
    private sessionService: SessionService,
    private businessmanService: BusinessmanService,
    private supplierService: SupplierService
  ) {
    super();
    this.resourceEndpoint = environment.userEndpointPath;
  }

  ngOnInit() {
    // Inicializar el SessionService pasando una referencia a este servicio
    this.sessionService.init(this);
  }

  // Verificar si el email ya existe sin usar Observable
  checkEmailExists(email: string, callback: (exists: boolean) => void): void {
    this.http.get<User[]>(`${this.serverBaseUrl}/users?email=${email}`)
      .subscribe({
        next: (users) => {
          callback(users.length > 0);
        },
        error: (error) => {
          console.error('Error al verificar el email:', error);
          callback(false); // Asumimos que no existe en caso de error
        }
      });
  }

  // Login mejorado
  login(credentials: { email: string, password: string }, callback?: Function) {
    this.http.get<User[]>(`${this.serverBaseUrl}/users?email=${credentials.email}`)
      .subscribe({
        next: (users) => {
          if (users && users.length > 0 && users[0].password === credentials.password) {
            const user = users[0];
            const token = "fake-jwt-token-" + Date.now();

            // Store in localStorage
            localStorage.setItem('auth_token', token);
            localStorage.setItem('current_user', JSON.stringify(user));

            // Start session
            this.sessionService.startSession(this);

            // Redirect based on role
            this.redirectBasedOnRole(user.role);

            if (callback) {
              callback({ token, user });
            }
          } else {
            console.error('Credenciales incorrectas');
            alert('Email o contraseña incorrectos. Por favor, inténtelo de nuevo.');
            if (callback) {
              callback(null);
            }
          }
        },
        error: (error) => {
          console.error('Error en login:', error);
          if (callback) {
            callback(null);
          }
        }
      });
  }

  // Registro con verificación de email
  register(userData: any, callback?: Function) {
    // Primero verificamos si el email ya existe
    this.checkEmailExists(userData.email, (exists) => {
      if (exists) {
        alert('Este correo electrónico ya está registrado.');
        if (callback) callback(null);
        return;
      }

      // Si el email no existe, procedemos con el registro
      this.http.post<User>(`${this.serverBaseUrl}/users`, {
        ...userData,
        id: Date.now(),
        role: "pending"
      }).subscribe({
        next: (newUser) => {
          console.log('Usuario registrado correctamente:', newUser);
          if (callback) {
            callback(newUser);
          }
        },
        error: (error) => {
          console.error('Error al registrar usuario:', error);
          alert('Error al registrar. Verifica la conexión con el servidor.');
          if (callback) {
            callback(null);
          }
        }
      });
    });
  }

  logout(navigate: boolean = true): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');

    // Finalizar sesión en el SessionService
    this.sessionService.endSession();

    if (navigate) {
      this.router.navigate(['/login']);
    }
  }

  // Asignar rol de usuario y crear perfil correspondiente
  setUserRole(role: 'businessman' | 'supplier'): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      // Actualizar el rol en el servidor
      const userId = currentUser.id;

      // URL correcta para actualizar el usuario
      this.http.patch<User>(`${this.serverBaseUrl}/users/${userId}`, { role })
        .subscribe({
          next: (updatedUser) => {
            // Actualizar usuario en localStorage
            localStorage.setItem('current_user', JSON.stringify(updatedUser));

            // Crear perfil correspondiente usando el servicio específico
            if (role === 'businessman') {
              this.businessmanService.createProfile(userId);
            } else if (role === 'supplier') {
              this.supplierService.createProfile(userId);
            }

            // Redirigir según el rol
            this.redirectBasedOnRole(role);
          },
          error: (error) => {
            console.error('Error al actualizar el rol:', error);

            // Si falla, actualizar localmente de todos modos
            const updatedUser = {
              ...currentUser,
              role: role
            };
            localStorage.setItem('current_user', JSON.stringify(updatedUser));

            // Intentar crear perfil de todos modos
            if (role === 'businessman') {
              this.businessmanService.createProfile(userId);
            } else if (role === 'supplier') {
              this.supplierService.createProfile(userId);
            }

            this.redirectBasedOnRole(role);
          }
        });
    }
  }

  redirectBasedOnRole(role: string) {
    console.log('Redirigiendo según rol:', role);
    if (role === 'businessman') {
      this.router.navigate(['/businessman']);
    } else if (role === 'supplier') {
      this.router.navigate(['/supplier']);
    } else if (role === 'pending') {
      this.router.navigate(['/select-role']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('current_user');
    if (userStr) {
      try {
        return JSON.parse(userStr) as User;
      } catch (e) {
        console.error('Error parsing user data');
        return null;
      }
    }
    return null;
  }

  getCurrentUserRole(): string | null {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }
}
