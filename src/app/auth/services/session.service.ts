import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  // 8 horas de duración máxima de sesión
  private readonly MAX_SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 horas
  // Tiempo de inactividad antes de cerrar (opcional, puedes ajustarlo)
  private readonly INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos

  private inactivityTimeoutId: any;
  private sessionTimeoutId: any;

  constructor() {
    // No podemos inyectar AuthService aquí por dependencia circular
  }

  init(authService: AuthService) {
    // Configurar eventos para detectar actividad
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, () => this.resetInactivityTimer(authService));
    });

    // ✅ HABILITADO: Cerrar sesión al cerrar navegador/pestaña
    window.addEventListener('beforeunload', () => {
      if (authService.isAuthenticated()) {
        // Limpiar sessionStorage para forzar logout en próxima visita
        this.endSession();
      }
    });

    // Verificar si hay una sesión activa al inicializar
    this.checkExistingSession(authService);
  }

  private checkExistingSession(authService: AuthService) {
    const sessionStart = sessionStorage.getItem('session_start');

    if (authService.isAuthenticated() && sessionStart) {
      const sessionStartTime = parseInt(sessionStart);
      const currentTime = Date.now();
      const sessionElapsed = currentTime - sessionStartTime;

      // Si la sesión ha superado las 8 horas, cerrar
      if (sessionElapsed >= this.MAX_SESSION_DURATION) {
        console.log('Sesión expirada por tiempo máximo (8 horas)');
        authService.logout();
        return;
      }

      // Calcular tiempo restante para la sesión
      const timeRemaining = this.MAX_SESSION_DURATION - sessionElapsed;

      // Iniciar temporizadores
      this.resetInactivityTimer(authService);
      this.startSessionTimer(authService, timeRemaining);
    }
  }

  private startSessionTimer(authService: AuthService, duration: number = this.MAX_SESSION_DURATION) {
    if (this.sessionTimeoutId) {
      clearTimeout(this.sessionTimeoutId);
    }

    this.sessionTimeoutId = setTimeout(() => {
      if (authService.isAuthenticated()) {
        console.log('Sesión cerrada por tiempo máximo (8 horas)');
        authService.logout();
      }
    }, duration);
  }

  private resetInactivityTimer(authService: AuthService) {
    if (this.inactivityTimeoutId) {
      clearTimeout(this.inactivityTimeoutId);
    }

    this.inactivityTimeoutId = setTimeout(() => {
      if (authService.isAuthenticated()) {
        console.log('Sesión cerrada por inactividad');
        authService.logout();
      }
    }, this.INACTIVITY_TIMEOUT);
  }

  startSession(authService: AuthService) {
    // Limpiar temporizadores previos
    this.clearAllTimers();

    // Establecer tiempo de inicio de sesión
    sessionStorage.setItem('session_start', Date.now().toString());

    // Iniciar ambos temporizadores
    this.startSessionTimer(authService);
    this.resetInactivityTimer(authService);
  }

  endSession() {
    this.clearAllTimers();
    sessionStorage.removeItem('session_start');
  }

  private clearAllTimers() {
    if (this.inactivityTimeoutId) {
      clearTimeout(this.inactivityTimeoutId);
    }
    if (this.sessionTimeoutId) {
      clearTimeout(this.sessionTimeoutId);
    }
  }

  // Método útil para obtener información de la sesión
  getSessionInfo(): { startTime: number | null, remainingTime: number | null, isActive: boolean } {
    const sessionStart = sessionStorage.getItem('session_start');

    if (!sessionStart) {
      return { startTime: null, remainingTime: null, isActive: false };
    }

    const startTime = parseInt(sessionStart);
    const currentTime = Date.now();
    const elapsed = currentTime - startTime;
    const remainingTime = Math.max(0, this.MAX_SESSION_DURATION - elapsed);

    return {
      startTime,
      remainingTime,
      isActive: remainingTime > 0
    };
  }
}
