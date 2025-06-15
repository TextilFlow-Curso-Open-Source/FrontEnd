import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BatchService } from '../../../batch/services/batch.service.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Batch, STATUS } from '../../../batch/models/batch.entity';

interface LotSummary {
  pending: number;
  sent: number;
  confirmed: number;
}

interface Notification {
  code: string;
  messages: string[];
}

@Component({
  selector: 'app-supplier-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './supplier-home.component.html',
  styleUrl: './supplier-home.component.css'
})
export class SupplierHomeComponent implements OnInit {
  private batchService = inject(BatchService);
  private authService = inject(AuthService);

  supplierName = 'Telas del Sur';
  lotSummary: LotSummary = { pending: 0, sent: 0, confirmed: 0 };
  notificationsGrouped: Notification[] = [];
  showNotifications = true;

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser || !currentUser.id) {
      console.error('No hay usuario autenticado o falta ID');
      this.authService.logout();
      return;
    }

    const supplierId = currentUser.id;

    this.batchService.getBySupplierId(supplierId).subscribe((batches: Batch[]) => {
      const summary = { pending: 0, sent: 0, confirmed: 0 };
      const notificationMap: { [code: string]: string[] } = {};

      // Ordenar los lotes por fecha descendente (últimos primero)
      const sortedBatches = [...batches].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      for (const batch of sortedBatches) {
        if (batch.status === STATUS.POR_ENVIAR) {
          summary.pending++;

          if (!notificationMap[batch.code]) {
            notificationMap[batch.code] = [];
          }

          notificationMap[batch.code].push(`Recuerda enviar el lote ${batch.code} hoy.`);

          if (batch.observations && batch.observations.trim() !== '') {
            notificationMap[batch.code].push(`Dejó una observación en el lote ${batch.code}.`);
          }

          if (!batch.imageUrl || batch.imageUrl.trim() === '') {
            notificationMap[batch.code].push(`Falta evidencia en el lote ${batch.code}.`);
          }
        } else if (batch.status === STATUS.ENVIADO) {
          summary.sent++;
        } else {
          summary.confirmed++;
        }
      }

      this.lotSummary = summary;

      this.notificationsGrouped = Object.entries(notificationMap).map(([code, messages]) => ({
        code,
        messages
      }));
    });
  }

  viewDetails(type: string): void {
    console.log(`Ver detalles de lotes ${type}`);
  }

  viewMoreNotifications(): void {
    console.log('Ver más notificaciones');
  }

  closeNotifications(): void {
    this.showNotifications = false;
  }

  openNotifications(): void {
    this.showNotifications = true;
  }
}

