// /src/app/auth/services/session.service.ts
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos en milisegundos
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

    // Configurar evento para cierre del navegador
    window.addEventListener('beforeunload', () => {
      // Al cerrar el navegador, eliminamos el token
      if (authService.isAuthenticated()) {
        authService.logout(false); // false para no navegar al login
      }
    });

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

  // Método para iniciar la sesión (llamar cuando el usuario inicia sesión)
  startSession(authService: AuthService) {
    this.resetInactivityTimer(authService);

    // Guardamos la hora de inicio de sesión
    sessionStorage.setItem('session_start', Date.now().toString());
  }

  // Método para finalizar la sesión (llamar cuando el usuario cierra sesión)
  endSession() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    sessionStorage.removeItem('session_start');
  }
}
