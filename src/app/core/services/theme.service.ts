// /src/app/core/services/theme.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ActiveTheme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'user-theme-preference';

  // Estado reactivo del tema
  private themeSubject = new BehaviorSubject<ThemeMode>('auto');
  private activeThemeSubject = new BehaviorSubject<ActiveTheme>('light');

  // Observables públicos
  public theme$ = this.themeSubject.asObservable();
  public activeTheme$ = this.activeThemeSubject.asObservable();

  // MediaQuery para detectar tema del sistema
  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  constructor() {
    this.initializeTheme();
    this.setupSystemThemeListener();
  }

  /**
   * Inicializa el tema al arrancar la aplicación
   */
  private initializeTheme(): void {
    // Primero intentar cargar desde localStorage
    const savedTheme = localStorage.getItem(this.THEME_KEY) as ThemeMode;

    if (savedTheme && this.isValidTheme(savedTheme)) {
      this.setTheme(savedTheme, false); // false = no guardar en localStorage otra vez
    } else {
      // Si no hay tema guardado, usar 'auto'
      this.setTheme('auto', true);
    }
  }

  /**
   * Configura el listener para cambios en el tema del sistema
   */
  private setupSystemThemeListener(): void {
    this.mediaQuery.addEventListener('change', (e) => {
      // Solo reaccionar si el modo actual es 'auto'
      if (this.themeSubject.value === 'auto') {
        this.updateActiveTheme('auto');
      }
    });
  }

  /**
   * Establece el tema de la aplicación
   */
  setTheme(mode: ThemeMode, save: boolean = true): void {
    console.log(`🎨 Cambiando tema a: ${mode}`);

    this.themeSubject.next(mode);
    this.updateActiveTheme(mode);

    if (save) {
      localStorage.setItem(this.THEME_KEY, mode);
    }
  }

  /**
   * Actualiza el tema activo basado en el modo seleccionado
   */
  private updateActiveTheme(mode: ThemeMode): void {
    let activeTheme: ActiveTheme;

    switch (mode) {
      case 'light':
        activeTheme = 'light';
        break;
      case 'dark':
        activeTheme = 'dark';
        break;
      case 'auto':
        activeTheme = this.mediaQuery.matches ? 'dark' : 'light';
        break;
    }

    console.log(`🌓 Tema activo: ${activeTheme}`);

    this.activeThemeSubject.next(activeTheme);
    this.applyThemeToDOM(activeTheme);
  }

  /**
   * Aplica el tema al DOM
   */
  private applyThemeToDOM(theme: ActiveTheme): void {
    const body = document.body;

    // Remover clases de tema anteriores
    body.classList.remove('light-theme', 'dark-theme');

    // Agregar clase del tema actual
    body.classList.add(`${theme}-theme`);

    // También agregar data attribute para CSS
    body.setAttribute('data-theme', theme);
  }

  /**
   * Obtiene el tema actual (modo seleccionado)
   */
  getCurrentTheme(): ThemeMode {
    return this.themeSubject.value;
  }

  /**
   * Obtiene el tema activo (el que realmente se está aplicando)
   */
  getCurrentActiveTheme(): ActiveTheme {
    return this.activeThemeSubject.value;
  }

  /**
   * Cambia entre light y dark (para botones toggle simples)
   */
  toggleTheme(): void {
    const current = this.getCurrentTheme();
    const newTheme: ThemeMode = current === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Sincroniza el tema con la configuración de la base de datos
   * (Para usar cuando se carga la configuración del usuario)
   */
  syncFromConfiguration(configTheme: string): void {
    if (this.isValidTheme(configTheme as ThemeMode)) {
      this.setTheme(configTheme as ThemeMode, true);
    }
  }

  /**
   * Obtiene el tema para guardar en configuración
   */
  getThemeForConfiguration(): ThemeMode {
    return this.getCurrentTheme();
  }

  /**
   * Verifica si un string es un tema válido
   */
  private isValidTheme(theme: string): theme is ThemeMode {
    return ['light', 'dark', 'auto'].includes(theme);
  }

  /**
   * Detecta si el sistema prefiere tema oscuro
   */
  getSystemPreference(): ActiveTheme {
    return this.mediaQuery.matches ? 'dark' : 'light';
  }

  /**
   * Para debugging - información del estado actual
   */
  getDebugInfo(): object {
    return {
      selectedMode: this.getCurrentTheme(),
      activeTheme: this.getCurrentActiveTheme(),
      systemPrefers: this.getSystemPreference(),
      savedInStorage: localStorage.getItem(this.THEME_KEY)
    };
  }
}
