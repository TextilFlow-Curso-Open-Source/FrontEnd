// /src/app/auth/services/auth.service.ts
import { Injectable, Injector } from '@angular/core';
import { BaseService } from '../../core/services/base.service.service';
import { User } from '../models/user.entity';
import { Router } from '@angular/router';
import { SessionService } from './session.service';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService extends BaseService<User> {
  constructor(
    private router: Router,
    private sessionService: SessionService,
    private injector: Injector
  ) {
    super();
    this.resourceEndpoint = environment.userEndpointPath;

    // Inicializar SessionService
    this.sessionService.init(this);
  }

  /**
   * Verifica si un email ya existe en el sistema
   * @param email Email a verificar
   */
  checkEmailExists(email: string) {
    return this.getAll().pipe(
      map((users: User[]) => users.some(user => user.email === email))
    );
  }

  /**
   * Inicia sesión y carga configuraciones del usuario automáticamente
   * @param credentials Credenciales de login
   */
  login(credentials: { email: string, password: string }): void {
    this.getAll().subscribe({
      next: (users) => {
        const user = users.find(u => u.email === credentials.email && u.password === credentials.password);

        if (user) {
          const token = "fake-jwt-token-" + Date.now();

          // Guardar sesión
          this.saveSession(token, user);

          // Cargar y aplicar configuraciones del usuario INMEDIATAMENTE
          this.loadUserConfigurations(user.id!).then(() => {
            // Redirigir según rol después de aplicar configuraciones
            this.redirectBasedOnRole(user.role);
          });
        } else {
          console.error('Credenciales incorrectas');
        }
      },
      error: (error) => {
        console.error('Error en login:', error);
      }
    });
  }

  /**
   * Carga y aplica las configuraciones del usuario inmediatamente
   * @param userId ID del usuario
   */
  private async loadUserConfigurations(userId: string): Promise<void> {
    try {
      console.log('⚙️ Cargando configuraciones del usuario...');

      // Importar servicios dinámicamente
      const [configModule, themeModule, translateModule] = await Promise.all([
        import('../../configuration/services/configuration.service'),
        import('../../core/services/theme.service'),
        import('@ngx-translate/core')
      ]);

      const configService = this.injector.get(configModule.ConfigurationService);
      const themeService = this.injector.get(themeModule.ThemeService);
      const translateService = this.injector.get(translateModule.TranslateService);

      // Cargar configuración del usuario
      configService.getByUserId(userId).subscribe({
        next: (configs: any) => {
          let userConfig = null;

          if (Array.isArray(configs) && configs.length > 0) {
            userConfig = configs[0];
          } else if (!Array.isArray(configs) && configs) {
            userConfig = configs;
          }

          if (userConfig) {
            console.log('📋 Aplicando configuraciones:', userConfig);

            // Aplicar idioma del usuario
            if (userConfig.language) {
              translateService.use(userConfig.language);
              localStorage.setItem('userLanguage', userConfig.language);
              console.log(`🌍 Idioma aplicado: ${userConfig.language}`);
            }

            // Aplicar tema del usuario
            if (userConfig.viewMode) {
              themeService.setTheme(userConfig.viewMode);
              console.log(`🎨 Tema aplicado: ${userConfig.viewMode}`);
            }

            console.log('✅ Configuraciones aplicadas exitosamente');
          } else {
            console.log('⚠️ No se encontraron configuraciones, usando por defecto');
          }
        },
        error: (error) => {
          console.error('❌ Error al cargar configuraciones:', error);
        }
      });
    } catch (error) {
      console.error('❌ Error al importar servicios:', error);
    }
  }

  /**
   * Registra un nuevo usuario y maneja todo automáticamente
   * @param userData Datos del usuario a registrar
   */
  register(userData: any): void {
    // Primero verificar si el email existe
    this.checkEmailExists(userData.email).subscribe({
      next: (exists) => {
        if (exists) {
          console.error('Este correo electrónico ya está registrado.');
          return;
        }

        // Si no existe, crear usuario
        const newUser = new User({
          ...userData,
          role: "pending"
        });

        this.create(newUser).subscribe({
          next: (createdUser) => {
            console.log('Usuario registrado correctamente:', createdUser);

            // Guardar sesión inmediatamente con el usuario creado
            const token = "fake-jwt-token-" + Date.now();
            this.saveSession(token, createdUser);

            // Redirigir según rol (será "pending")
            this.redirectBasedOnRole(createdUser.role);
          },
          error: (error) => {
            console.error('Error al registrar usuario:', error);
          }
        });
      },
      error: (error) => {
        console.error('Error al verificar email:', error);
      }
    });
  }

  /**
   * Cierra la sesión del usuario
   * @param navigate Si debe navegar al login
   */
  logout(navigate: boolean = true): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');

    // Finalizar sesión en el SessionService
    this.sessionService.endSession();

    if (navigate) {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Asigna rol al usuario actual y crea perfil automáticamente
   * @param role Rol a asignar
   */
  setUserRole(role: 'businessman' | 'supplier'): void {
    const currentUser = this.getCurrentUser();

    console.log('Usuario actual para setUserRole:', currentUser);

    if (!currentUser) {
      console.error('No hay usuario actual');
      return;
    }

    if (!currentUser.id) {
      console.error('Usuario actual no tiene ID asignado');
      return;
    }

    const updatedUser = new User({
      ...currentUser,
      role: role
    });

    // Actualizar rol en la tabla users
    this.update(currentUser.id, updatedUser).subscribe({
      next: (response) => {
        console.log('Usuario actualizado:', response);
        // Actualizar usuario en localStorage
        localStorage.setItem('current_user', JSON.stringify(response));

        // Crear/actualizar perfil correspondiente con el mismo ID
        this.createProfileForRole(role, currentUser.id!);

        // Redirigir según el rol
        this.redirectBasedOnRole(role);
      },
      error: (error) => {
        console.error('Error al actualizar el rol:', error);

        // Si falla la actualización, actualizar localmente
        localStorage.setItem('current_user', JSON.stringify(updatedUser));

        // Intentar crear perfil de todos modos
        this.createProfileForRole(role, currentUser.id!);

        this.redirectBasedOnRole(role);
      }
    });
  }

  /**
   * Recarga el usuario actual desde el servidor
   */
  private async reloadCurrentUser(): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (!currentUser?.email) {
      throw new Error('No se puede recargar: usuario sin email');
    }

    return new Promise((resolve, reject) => {
      this.getAll().subscribe({
        next: (users) => {
          const foundUser = users.find(u => u.email === currentUser.email);
          if (foundUser) {
            localStorage.setItem('current_user', JSON.stringify(foundUser));
            resolve();
          } else {
            reject(new Error('Usuario no encontrado en el servidor'));
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  /**
   * Crea perfil según el rol usando Injector para evitar dependencia circular
   * @param role Rol del usuario
   * @param userId ID del usuario (string)
   */
  private createProfileForRole(role: 'businessman' | 'supplier', userId: string): void {
    console.log(`Creando perfil para rol: ${role}, userId: ${userId}`);

    try {
      if (role === 'businessman') {
        import('../../businessman/services/businessman.service').then(module => {
          const businessmanService = this.injector.get(module.BusinessmanService);
          businessmanService.createProfile(userId).subscribe({
            next: (profile: any) => {
              console.log('Perfil businessman creado/actualizado:', profile);
            },
            error: (error: any) => {
              console.error('Error creando perfil businessman:', error);
              // En caso de error, aún así redirigir al usuario
              this.redirectBasedOnRole(role);
            }
          });
        }).catch(error => {
          console.error('Error importando BusinessmanService:', error);
          this.redirectBasedOnRole(role);
        });
      } else if (role === 'supplier') {
        import('../../supplier/services/supplier.service').then(module => {
          const supplierService = this.injector.get(module.SupplierService);
          supplierService.createProfile(userId).subscribe({
            next: (profile: any) => {
              console.log('Perfil supplier creado/actualizado:', profile);
            },
            error: (error: any) => {
              console.error('Error creando perfil supplier:', error);
              // En caso de error, aún así redirigir al usuario
              this.redirectBasedOnRole(role);
            }
          });
        }).catch(error => {
          console.error('Error importando SupplierService:', error);
          this.redirectBasedOnRole(role);
        });
      }
    } catch (error) {
      console.error('Error al crear perfil:', error);
      // En caso de cualquier error, redirigir al usuario
      this.redirectBasedOnRole(role);
    }
  }

  /**
   * Redirige basado en el rol del usuario
   * @param role Rol del usuario
   */
  redirectBasedOnRole(role: string): void {
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

  /**
   * Obtiene el usuario actual del localStorage
   */
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

  /**
   * Obtiene el rol del usuario actual
   */
  getCurrentUserRole(): string | null {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  /**
   * Guarda los datos de sesión
   * @param token Token de autenticación
   * @param user Datos del usuario
   */
  saveSession(token: string, user: User): void {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('current_user', JSON.stringify(user));
    this.sessionService.startSession(this);
  }
}
