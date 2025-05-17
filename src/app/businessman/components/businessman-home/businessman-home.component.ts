import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';

interface LotSummary {
  pending: number;
  sent: number;
  confirmed: number;
}

interface Notification {
  message: string;
  id: string;
}

@Component({
  selector: 'app-businessman-home',
  standalone:true,
  imports: [CommonModule,TranslateModule],
  templateUrl: './businessman-home.component.html',
  styleUrl: './businessman-home.component.css'
})
export class BusinessmanHomeComponent {
  supplierName = 'Nome';

  lotSummary: LotSummary = {
    pending: 4,
    sent: 12,
    confirmed: 8
  };

  notifications: Notification[] = [
    { id: 'n1', message: 'Falta subir evidencia del lote L-007.' },
    { id: 'n2', message: 'Recuerda enviar el lote L-008 hoy.' },
    { id: 'n3', message: 'El cliente Telas Perú dejó una observación en el lote L-003.' }
  ];

  constructor() { }

  viewDetails(type: string): void {
    console.log(`Ver detalles de lotes ${type}`);
    // Aquí implementarías la navegación o lógica para mostrar más detalles
  }

  viewMoreNotifications(): void {
    console.log('Ver más notificaciones');
    // Aquí implementarías la navegación a la página de notificaciones
  }

  closeNotifications(): void {
    console.log('Cerrar notificaciones');
    // Lógica para cerrar o minimizar el panel de notificaciones
  }
}
