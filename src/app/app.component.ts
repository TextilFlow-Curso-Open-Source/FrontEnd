// app.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { AuthService } from './auth/services/auth.service';
import { SessionService } from './auth/services/session.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChatbotComponent } from './core/components/chatbot/chatbot.component';
import { ConfigurationService } from './configuration/services/configuration.service';
import { combineLatest, of, Observable } from 'rxjs';
import { filter, map, switchMap, startWith, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    TranslateModule,
    ChatbotComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'textil-flow';

  // Observable para mostrar/ocultar chatbot
  showChatbot$: Observable<boolean>;

  constructor(
    private authService: AuthService,
    private translateService: TranslateService,
    private router: Router,
    private configService: ConfigurationService
  ) {
    // Inicializar el servicio de traducción
    this.translateService.setDefaultLang('es');
    this.translateService.use('es');

    // Configurar el observable del chatbot
    this.showChatbot$ = this.setupChatbotVisibility();
  }

  ngOnInit() {
    // Tu código existente aquí
  }

  private setupChatbotVisibility(): Observable<boolean> {
    return this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map((event: NavigationEnd) => event.url),
      startWith(this.router.url),
      switchMap(currentUrl => {
        // Verificar rutas públicas primero
        if (this.isPublicRoute(currentUrl)) {
          return of(false);
        }

        // Verificar autenticación y configuración
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser?.id) {
          return of(false);
        }

        // Obtener configuración del usuario
        return this.configService.getConfigurationByUserId(parseInt(currentUser.id)).pipe(
          map(config => this.shouldShowChatbot(config)),
          catchError(() => of(false))
        );
      })
    );
  }

  private isPublicRoute(url: string): boolean {
    const publicRoutes = [
      '/login',
      '/register',
      '/select-role',
      '/forgot-password',
      '/reset-password'
    ];
    return publicRoutes.some(route => url.startsWith(route));
  }

  private shouldShowChatbot(config: any): boolean {
    if (!config) return false;

    return config.subscriptionPlan === 'corporate' &&
      config.subscriptionStatus === 'ACTIVE';
  }
}
