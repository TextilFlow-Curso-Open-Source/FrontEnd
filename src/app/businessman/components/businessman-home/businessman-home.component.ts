import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { BatchService } from '../../../batch/services/batch.service.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Batch, STATUS } from '../../../batch/models/batch.entity';

interface LotSummary {
  receivedToday: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface Notification {
  code: string;
  messages: string[];
}

@Component({
  selector: 'app-businessman-home',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './businessman-home.component.html',
  styleUrl: './businessman-home.component.css'
})
export class BusinessmanHomeComponent implements OnInit {
  private batchService = inject(BatchService);
  private authService = inject(AuthService);
  private router = inject(Router);

  businessmanName = 'Empresario';
  lotSummary: LotSummary = { receivedToday: 0, pending: 0, approved: 0, rejected: 0 };
  notificationsGrouped: Notification[] = [];
  showNotifications = true;

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();

    if (currentUser) {
      const name = currentUser.name ?? '';
      const email = currentUser.email ?? '';

      if (name.trim()) {
        this.businessmanName = name.trim();
      } else if (email.includes('@')) {
        this.businessmanName = email.split('@')[0] || 'Empresario';
      }
    }

    this.batchService.getAll().subscribe((batches: Batch[]) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const summary = { receivedToday: 0, pending: 0, approved: 0, rejected: 0 };
      const notificationMap: { [code: string]: string[] } = {};

      // Ordenar los lotes por fecha descendente (últimos primero)
      const sortedBatches = [...batches].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      for (const batch of sortedBatches) {
        const batchDate = new Date(batch.date);
        batchDate.setHours(0, 0, 0, 0);

        // Lotes recibidos hoy
        if (batchDate.getTime() === today.getTime()) {
          summary.receivedToday++;
        }

        // Contar por estado
        if (batch.status === STATUS.PENDIENTE) {
          summary.pending++;

          const batchCode = batch.code ?? 'Sin código';
          if (!notificationMap[batchCode]) {
            notificationMap[batchCode] = [];
          }

          // Verificar si lleva más de 2 días pendiente
          const daysDiff = (new Date().getTime() - batchDate.getTime()) / (1000 * 3600 * 24);
          if (daysDiff > 2) {
            notificationMap[batchCode].push(`El lote ${batchCode} lleva más de 2 días pendiente de revisión.`);
          }

          if (batch.observations && batch.observations.trim() !== '') {
            notificationMap[batchCode].push(`Hay observaciones en el lote ${batchCode}.`);
          }

          const imageUrl = batch.imageUrl ?? '';
          if (!imageUrl.trim()) {
            notificationMap[batchCode].push(`Falta evidencia en el lote ${batchCode}.`);
          }
        } else if (batch.status === STATUS.ACEPTADO) {
          summary.approved++;
        } else if (batch.status === STATUS.RECHAZADO) {
          summary.rejected++;
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
    this.router.navigate(['/businessman/lotes']);
  }

  viewMoreNotifications(): void {
    this.router.navigate(['/businessman/lotes']);
  }

  closeNotifications(): void {
    this.showNotifications = false;
  }

  openNotifications(): void {
    this.showNotifications = true;
  }
}
