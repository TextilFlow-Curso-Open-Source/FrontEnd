import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  // Tiempo más largo: 8 horas
  private readonly INACTIVITY_TIMEOUT = 8 * 60 * 60 * 1000; // 8 horas
  private timeoutId: any;

  constructor() {
    // No podemos inyectar AuthService aquí por dependencia circular
  }

  init(authService: AuthService) {
    // Configurar eventos para detectar actividad
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, () => this.resetInactivityTimer(authService));
    });

    // ❌ COMENTADO: No cerrar sesión al recargar página
    // window.addEventListener('beforeunload', () => {
    //   if (authService.isAuthenticated()) {
    //     authService.logout(false);
    //   }
    // });

    // Si el usuario ya está autenticado, iniciar el temporizador
    if (authService.isAuthenticated()) {
      this.resetInactivityTimer(authService);
    }
  }

  resetInactivityTimer(authService: AuthService) {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      if (authService.isAuthenticated()) {
        console.log('Sesión cerrada por inactividad');
        authService.logout();
      }
    }, this.INACTIVITY_TIMEOUT);
  }

  startSession(authService: AuthService) {
    this.resetInactivityTimer(authService);
    sessionStorage.setItem('session_start', Date.now().toString());
  }

  endSession() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    sessionStorage.removeItem('session_start');
  }
}
