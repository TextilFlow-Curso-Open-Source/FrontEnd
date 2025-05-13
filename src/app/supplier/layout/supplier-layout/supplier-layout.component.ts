import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../auth/services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-supplier-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './supplier-layout.component.html',
  styleUrls: ['./supplier-layout.component.css']
})
export class SupplierLayoutComponent implements OnInit {
  currentPageTitle = 'Inicio';

  menuItems = [
    { id: 'inicio', label: 'Inicio', icon: 'home', route: '/supplier/inicio' },
    { id: 'mis-lotes', label: 'Mis lotes', icon: 'description', route: '/supplier/mis-lotes' },
    { id: 'registrar-lotes', label: 'Registrar Lotes', icon: 'add_box', route: '/supplier/registrar-lotes' },
    { id: 'observaciones', label: 'Observaciones', icon: 'comment', route: '/supplier/observaciones' },
    { id: 'solicitudes-empresarios', label: 'Solicitudes de empresarios', icon: 'notifications', route: '/supplier/solicitudes-empresarios' },
    { id: 'planes', label: 'Planes y suscripción', icon: 'payments', route: '/supplier/planes' },
  ];

  profileItems = [
    { id: 'configuracion', label: 'Configuración', icon: 'settings', route: '/supplier/configuracion' },
    { id: 'perfil', label: 'Mi perfil', icon: 'person', route: '/supplier/perfil' },
    { id: 'salir', label: 'Cerrar sesión', icon: 'exit_to_app', route: '/login' }
  ];

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Actualizar el título de la página cuando cambia la ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updatePageTitle();
    });

    // Establecer el título inicial
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
