import { Injectable, Injector } from '@angular/core';
import { BaseService} from '../../core/services/base.service';
import { User } from '../models/user.entity';
import { Router } from '@angular/router';
import { SessionService } from './session.service';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';

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

    // ✅ NUEVO: Verificar y limpiar sesión anterior antes de inicializar
    this.checkAndCleanPreviousSession();

    // Inicializar SessionService
    this.sessionService.init(this);
  }

  /**
   * ✅ NUEVO: Verifica si hay datos de sesión anterior y los limpia si es necesario
   */
  private checkAndCleanPreviousSession(): void {
    const sessionStart = sessionStorage.getItem('session_start');
    const authToken = localStorage.getItem('auth_token');
    const currentUser = localStorage.getItem('current_user');

    // Si NO hay session_start pero SÍ hay datos de auth en localStorage,
    // significa que es una nueva sesión del navegador con datos antiguos
    if (!sessionStart && (authToken || currentUser)) {
      console.log('🧹 Limpiando sesión anterior - Nueva sesión del navegador detectada');
      this.clearAllSessionData();
      return;
    }

    // Si hay session_start, verificar si la sesión ha expirado
    if (sessionStart && authToken) {
      const sessionStartTime = parseInt(sessionStart);
      const currentTime = Date.now();
      const MAX_SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 horas
      const sessionElapsed = currentTime - sessionStartTime;

      if (sessionElapsed >= MAX_SESSION_DURATION) {
        console.log('🧹 Limpiando sesión anterior - Sesión expirada por tiempo');
        this.clearAllSessionData();
        return;
      }
    }
  }

  /**
   * ✅ NUEVO: Limpia todos los datos de sesión
   */
  private clearAllSessionData(): void {
    // Limpiar localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    localStorage.removeItem('userLanguage'); // Si guardas idioma

    // Limpiar sessionStorage
    sessionStorage.removeItem('session_start');

    // Cualquier otro dato de sesión que tengas
    console.log('✅ Todos los datos de sesión anterior han sido limpiados');
  }

  /**
   * Verifica si un email ya existe en el sistema
   * @param email Email a verificar
   * @deprecated Esta validación ahora se hace en el backend
   */
  checkEmailExists(email: string): Observable<boolean> {
    // El backend maneja la validación, pero mantenemos el método para compatibilidad
    return this.customRequest<any[]>('/users', 'GET').pipe(
      map((users: any[]) => users.some(user => user.email === email))
    );
  }

  /**
   * Inicia sesión con el backend real
   * @param credentials Credenciales de login
   */
  login(credentials: { email: string, password: string }): void {
    const signInRequest = {
      email: credentials.email,
      password: credentials.password
    };

    this.customRequest<any>('/authentication/sign-in', 'POST', signInRequest, false).subscribe({
      next: (response: any) => {
        this.saveSession(response.token, this.transformBackendUserToFrontend(response));

        // *** CAMBIO: Marcar como carga inicial ***
        this.loadUserConfigurations(response.id.toString(), true).then(() => {
          this.redirectBasedOnRole(response.role);
        });
      },
      error: (error) => {
        console.error('Error en login:', error);
      }
    });
  }

  /**
   * Registra un nuevo usuario con el backend real
   * @param userData Datos del usuario a registrar
   */
  register(userData: any): void {
    const signUpRequest = {
      email: userData.email,
      password: userData.password,
      name: userData.name,
      country: userData.country,
      city: userData.city,
      address: userData.address,
      phone: userData.phone,
      role: 'PENDING'
    };

    this.customRequest<any>('/authentication/sign-up', 'POST', signUpRequest, false).subscribe({
      next: (response: any) => {
        console.log('Usuario registrado exitosamente:', response);

        // Hacer login automáticamente con las credenciales del registro
        this.login({
          email: userData.email,
          password: userData.password
        });
      },
      error: (error) => {
        console.error('Error en registro:', error);
      }
    });
  }

  /**
   * Actualiza el rol del usuario
   * @param role Nuevo rol del usuario
   */
  setUserRole(role: 'businessman' | 'supplier'): void {
    const currentUser = this.getCurrentUser();

    if (!currentUser || !currentUser.id) {
      console.error('No hay usuario actual o no tiene ID');
      return;
    }

    const updateRoleRequest = { role: role.toUpperCase() };

    this.customRequest<any>(`/users/${currentUser.id}/role`, 'PUT', updateRoleRequest).subscribe({
      next: (response: any) => {
        // Actualizar usuario en localStorage
        const updatedUser = this.transformBackendUserToFrontend(response);
        this.setCurrentUser(updatedUser);

        // Crear perfil correspondiente
        this.createProfileForRole(role, currentUser.id!);

        // Redirigir según el rol
        this.redirectBasedOnRole(role);
      },
      error: (error) => {
        console.error('Error al actualizar rol:', error);
      }
    });
  }

  /**
   * Transforma usuario del backend al formato del frontend
   */
  private transformBackendUserToFrontend(backendUser: any): User {
    return new User({
      id: backendUser.id?.toString() || '', // Convertir Long a string
      name: backendUser.name || '',
      email: backendUser.email || '',
      role: backendUser.role?.toLowerCase() || 'pending',
      country: backendUser.country || '',
      city: backendUser.city || '',
      address: backendUser.address || '',
      phone: backendUser.phone || ''
    });
  }

  /**
   * Transforma usuario del frontend al formato del backend
   */
  private transformFrontendUserToBackend(frontendUser: User): any {
    return {
      id: frontendUser.id ? parseInt(frontendUser.id) : undefined,
      name: frontendUser.name,
      email: frontendUser.email,
      password: frontendUser.password,
      role: frontendUser.role?.toUpperCase(),
      country: frontendUser.country,
      city: frontendUser.city,
      address: frontendUser.address,
      phone: frontendUser.phone
    };
  }

  /**
   * Carga y aplica las configuraciones del usuario
   * @param userId ID del usuario
   */
  private async loadUserConfigurations(userId: string, isInitialLoad: boolean = true): Promise<void> {
    try {
      console.log(`⚙️ Cargando configuraciones del usuario... (inicial: ${isInitialLoad})`);

      const [configModule, themeModule, translateModule] = await Promise.all([
        import('../../configuration/services/configuration.service'),
        import('../../core/services/theme.service'),
        import('@ngx-translate/core')
      ]);

      const configService = this.injector.get(configModule.ConfigurationService);
      const themeService = this.injector.get(themeModule.ThemeService);
      const translateService = this.injector.get(translateModule.TranslateService);

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

            // Aplicar idioma siempre
            if (userConfig.language) {
              translateService.use(userConfig.language);
              localStorage.setItem('userLanguage', userConfig.language);
              console.log(`🌍 Idioma aplicado: ${userConfig.language}`);
            }

            // *** FIX CLAVE: Solo aplicar tema en carga inicial (login) ***
            if (userConfig.viewMode && isInitialLoad) {
              themeService.setTheme(userConfig.viewMode);
              console.log(`🎨 Tema aplicado (login inicial): ${userConfig.viewMode}`);
            } else if (userConfig.viewMode && !isInitialLoad) {
              console.log(`⚠️ Tema NO aplicado (recarga): ${userConfig.viewMode}`);
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
   * Cierra la sesión del usuario
   * @param navigate Si debe navegar al login
   */
  logout(navigate: boolean = true): void {
    // ✅ MEJORADO: Usar el método centralizado de limpieza
    this.clearAllSessionData();

    // Finalizar sesión en el SessionService
    this.sessionService.endSession();

    if (navigate) {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Crea perfil según el rol usando el backend real
   * @param role Rol del usuario
   * @param userId ID del usuario (string)
   */
  private createProfileForRole(role: 'businessman' | 'supplier', userId: string): void {
    console.log(`Creando perfil para rol: ${role}, userId: ${userId}`);

    try {
      const createProfileRequest = {
        // Datos mínimos para crear el perfil
        // El backend se encarga de crear el perfil con datos por defecto
      };

      if (role === 'businessman') {
        this.customRequest<any>(`/businessmen/${userId}`, 'POST', createProfileRequest).subscribe({
          next: (profile: any) => {
            console.log('Perfil businessman creado:', profile);
          },
          error: (error: any) => {
            console.error('Error creando perfil businessman:', error);
          }
        });
      } else if (role === 'supplier') {
        this.customRequest<any>(`/suppliers/${userId}`, 'POST', createProfileRequest).subscribe({
          next: (profile: any) => {
            console.log('Perfil supplier creado:', profile);
          },
          error: (error: any) => {
            console.error('Error creando perfil supplier:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error al crear perfil:', error);
    }
  }

  /**
   * Redirige basado en el rol del usuario
   * *** UPDATED: Siempre redirige a /planes para obligar pago ***
   * @param role Rol del usuario
   */
  redirectBasedOnRole(role: string): void {
    console.log('Redirigiendo según rol:', role);
    const normalizedRole = role.toLowerCase();

    if (normalizedRole === 'businessman') {
      this.router.navigate(['/businessman/planes']);    // ← CHANGED: Direct to plans
    } else if (normalizedRole === 'supplier') {
      this.router.navigate(['/supplier/planes']);       // ← CHANGED: Direct to plans
    } else if (normalizedRole === 'pending') {
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
   * ✅ MEJORADO: Verifica si el usuario está autenticado Y tiene sesión activa
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    const sessionStart = sessionStorage.getItem('session_start');

    // Debe tener token válido Y session_start (indica sesión activa del navegador)
    const hasValidToken = !!token && !token.startsWith('fake-jwt-token-') && !token.startsWith('temp-jwt-token-');
    const hasActiveSession = !!sessionStart;

    // Si tiene token pero no sesión activa, limpiar datos
    if (hasValidToken && !hasActiveSession) {
      console.log('🧹 Token encontrado sin sesión activa - Limpiando datos');
      this.clearAllSessionData();
      return false;
    }

    return hasValidToken && hasActiveSession;
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

  /**
   * Actualiza los datos de un usuario específico
   * @param userId ID del usuario a actualizar
   * @param userData Datos actualizados del usuario
   */
  updateUser(userId: string, userData: any): Observable<any> {
    const backendData = this.transformFrontendUserToBackend(userData);
    return this.customRequest<any>(`/users/${userId}`, 'PUT', backendData).pipe(
      map(response => this.transformBackendUserToFrontend(response))
    );
  }

  /**
   * Actualiza el usuario actual en memoria
   * @param user Usuario actualizado
   */
  setCurrentUser(user: any): void {
    localStorage.setItem('current_user', JSON.stringify(user));
    console.log('✅ Usuario actual actualizado:', user);
  }

  /**
   * Obtiene el perfil completo del usuario actual
   */
  getCurrentUserProfile(): Observable<any> {
    const currentUser = this.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      throw new Error('No hay usuario actual');
    }

    return this.customRequest<any>(`/profiles/${currentUser.id}`, 'GET');
  }

  /**
   * Solicita restablecimiento de contraseña
   * @param email Email del usuario
   */
  forgotPassword(email: string): Observable<any> {
    const requestBody = { email: email };

    // Usar la URL del environment + el endpoint de auth
    const url = `${environment.serverBaseUrl}${environment.authEndpointPath}/forgot-password`;

    return this.http.post(url, requestBody, {
      responseType: 'text'
    });
  }

  /**
   * Restablece la contraseña con token
   * @param token Token de restablecimiento
   * @param newPassword Nueva contraseña
   */
  resetPassword(token: string, newPassword: string): Observable<any> {
    const requestBody = {
      token: token,
      newPassword: newPassword
    };

    // Usar la URL del environment + el endpoint de auth
    const url = `${environment.serverBaseUrl}${environment.authEndpointPath}/reset-password`;

    return this.http.post(url, requestBody, {
      responseType: 'text'
    });
  }
}
