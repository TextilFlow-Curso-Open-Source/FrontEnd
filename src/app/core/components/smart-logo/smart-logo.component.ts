import { Component, Input, OnInit, OnDestroy, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-smart-logo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './smart-logo.component.html',
  styleUrls: ['./smart-logo.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class SmartLogoComponent implements OnInit, OnDestroy {
  @Input() type: 'login' | 'sidebar' | 'header' = 'login';
  @Input() alt: string = 'TextilFlow Logo';
  @Input() width: string = '170px';
  @Input() height: string = 'auto';
  @Input() landingUrl: string = 'https://textilflow-curso-open-source.github.io/Landing-Page-TextilFlow/';

  currentLogoUrl: string = '/assets/textil-flow-logo.svg';
  containerClass: string = '';

  private subscription = new Subscription();
  private themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    // Configurar clase del container según el tipo
    this.containerClass = this.type;

    // Ajustar tamaño según el tipo
    this.adjustSizeByType();

    // Suscribirse a cambios de tema
    this.subscription.add(
      this.themeService.activeTheme$.subscribe(theme => {
        this.updateLogoForTheme(theme);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * Maneja el click en el logo
   */
  onLogoClick(): void {


    if (this.type === 'login') {

      window.open(this.landingUrl, '_blank');
    } else {
      // Si estamos logueados (sidebar/header), ir al home según el rol
      const isAuthenticated = this.authService.isAuthenticated();

      if (isAuthenticated) {
        const userRole = this.authService.getCurrentUserRole();


        switch (userRole) {
          case 'businessman':
            this.router.navigate(['/businessman/inicio']);
            break;
          case 'supplier':
            this.router.navigate(['/supplier/inicio']);
            break;
          default:
            console.log('️ SmartLogo: Rol no reconocido, yendo al landing');
            window.open(this.landingUrl, '_blank');
        }
      } else {

        console.log('smartLogo: Usuario no autenticado, yendo al landing');
        window.open(this.landingUrl, '_blank');
      }
    }
  }

  private adjustSizeByType(): void {
    // El CSS maneja los tamaños principales, esto es solo backup
    switch (this.type) {
      case 'login':
        // CSS se encarga del tamaño
        break;
      case 'sidebar':
        this.width = '100%';
        this.height = '100%';
        break;
      case 'header':
        // CSS se encarga del tamaño
        break;
    }
  }

  private updateLogoForTheme(theme: 'light' | 'dark'): void {
    if (theme === 'dark') {
      // Cambiar a logo para tema oscuro
      this.currentLogoUrl = '/assets/textil-flow-logo-dark.svg';
    } else {
      // Logo normal para tema claro
      this.currentLogoUrl = '/assets/textil-flow-logo.svg';
    }
  }
}
