import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../auth/services/auth.service';
import { filter } from 'rxjs/operators';
import {TranslateModule} from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import {SmartLogoComponent} from '../../../core/components/smart-logo/smart-logo.component';

@Component({
  selector: 'app-businessman-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TranslateModule, SmartLogoComponent],
  templateUrl: './businessman-layout.component.html',
  styleUrls: ['./businessman-layout.component.css']
})
export class BusinessmanLayoutComponent implements OnInit {
  currentPageTitle = 'Inicio';

  menuItems = [
    { id: 'inicio', label: 'Inicio', icon: 'home', route: '/businessman/inicio' },
    { id: 'lotes', label: 'Lotes Recibidos', icon: 'description', route: '/businessman/lotes' },
    { id: 'observaciones', label: 'Observaciones enviadas', icon: 'comment', route: '/businessman/observaciones' },
    { id: 'Distribuidores', label: 'Agregar Distribuidor', icon: 'person_add', route: '/businessman/buscar-distribuidor' },
    { id: 'planes', label: 'Planes y suscripción', icon: 'payments', route: '/businessman/planes' },
  ];

  profileItems = [
    { id: 'configuracion', label: 'Configuración', icon: 'settings', route: '/businessman/configuracion' },
    { id: 'perfil', label: 'Mi perfil', icon: 'person', route: '/businessman/perfil' },
    { id: 'salir', label: 'Cerrar sesión', icon: 'exit_to_app', route: '/login' }
  ];

  private translateMenuItems(): void {
    this.menuItems = [
      { id: 'inicio', label: 'MENU.HOME', icon: 'home', route: '/businessman/inicio' },
      { id: 'lotes', label: 'MENU.BATCHES', icon: 'description', route: '/businessman/lotes' },
      { id: 'observaciones', label: 'MENU.OBSERVATIONS', icon: 'comment', route: '/businessman/observaciones' },
      { id: 'Distribuidores', label: 'MENU.ADD_SUPPLIER', icon: 'person_add', route: '/businessman/buscar-distribuidor' },
      { id: 'planes', label: 'MENU.SUBSCRIPTION', icon: 'payments', route: '/businessman/planes' }
    ];

    this.profileItems = [
      { id: 'configuracion', label: 'MENU.SETTINGS', icon: 'settings', route: '/businessman/configuracion' },
      { id: 'perfil', label: 'MENU.PROFILE', icon: 'person', route: '/businessman/perfil' },
      { id: 'salir', label: 'MENU.LOGOUT', icon: 'exit_to_app', route: '/login' }
    ];
  }

  constructor(
    private router: Router,
    private authService: AuthService,
    private translate: TranslateService
  ){}

  ngOnInit(): void {
    // Traducir menús al iniciar
    this.translateMenuItems();

    // Escuchar cambios de idioma
    this.translate.onLangChange.subscribe(() => {
      this.translateMenuItems();
      this.updatePageTitle(); // actualizar título si cambia idioma
    });

    // Ya tienes esto (lo dejamos igual)
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updatePageTitle();
    });

    this.updatePageTitle();
  }

  navigateTo(route: string): void {
    if (route === '/login') {
      this.authService.logout();
    } else {
      this.router.navigate([route]);
    }
  }

  isRouteActive(route: string): boolean {
    return this.router.url.includes(route);
  }

  private updatePageTitle(): void {
    const currentUrl = this.router.url;
    const allItems = [...this.menuItems, ...this.profileItems];

    for (const item of allItems) {
      if (currentUrl.includes(item.id)) {
        this.currentPageTitle = item.label;
        return;
      }
    }

    // Si no se encuentra una coincidencia, usar 'Inicio' como valor predeterminado
    this.currentPageTitle = 'Inicio';
  }
}
