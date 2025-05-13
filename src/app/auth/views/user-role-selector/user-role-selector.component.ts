// /src/app/auth/views/user-role-selector/user-role-selector.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AppButtonComponent } from '../../../core/components/app-button/app-button.component';

@Component({
  selector: 'app-user-role-selector',
  standalone: true,
  imports: [CommonModule, RouterModule, AppButtonComponent],
  templateUrl: './user-role-selector.component.html',
  styleUrls: ['./user-role-selector.component.css']
})
export class UserRoleSelectorComponent implements OnInit {
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Verificar si el usuario está autenticado
    if (!this.authService.isAuthenticated()) {
      this.authService.redirectBasedOnRole(''); // Redirigir a login
      return;
    }

    // Si ya tiene un rol válido, redirigir
    const role = this.authService.getCurrentUserRole();
    if (role === 'businessman' || role === 'supplier') {
      this.authService.redirectBasedOnRole(role);
    }
  }

  selectRole(role: 'businessman' | 'supplier'): void {
    // Prevenir múltiples clics
    if (this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';

    try {
      console.log(`Seleccionando rol: ${role}`);
      // Llamar al servicio que ahora utiliza los servicios específicos
      this.authService.setUserRole(role);

      // Agregar timeout por si algo falla
      setTimeout(() => {
        this.isLoading = false;

        // Si aún estamos aquí, algo falló en la redirección
        if (document.location.pathname.includes('select-role')) {
          this.errorMessage = 'Hubo un problema al seleccionar el rol. Por favor, intenta de nuevo.';
        }
      }, 5000);
    } catch (error) {
      this.isLoading = false;
      this.errorMessage = 'Error al seleccionar el rol. Por favor, inténtalo de nuevo.';
      console.error('Error al seleccionar rol:', error);
    }
  }
}
