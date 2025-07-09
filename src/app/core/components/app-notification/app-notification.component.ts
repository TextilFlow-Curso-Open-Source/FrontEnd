// core/components/app-notification/app-notification.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppButtonComponent } from '../app-button/app-button.component';
import { MatIconModule } from '@angular/material/icon';

export interface ContactInfo {
  supplierName: string;
  companyName: string;
  phone: string;
  email: string;
  location: string;
  specialization: string;
  description?: string;
  batchCode: string;
}

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule, AppButtonComponent, MatIconModule],
  templateUrl: './app-notification.component.html',
  styleUrls: ['./app-notification.component.css']
})
export class AppNotificationComponent implements OnInit, OnDestroy {
  @Input() show: boolean = false;
  @Input() message: string = 'Operación completada';
  @Input() type: 'success' | 'error' | 'warning' | 'info' | 'contact' = 'success';
  @Input() autoClose: boolean = false;
  @Input() duration: number = 3000;
  @Input() buttonText: string = 'Aceptar';

  // Nueva propiedad para información de contacto
  @Input() contactInfo: ContactInfo | null = null;

  @Output() showChange = new EventEmitter<boolean>();
  @Output() close = new EventEmitter<void>();

  timer: any;

  ngOnInit(): void {
    if (this.show && this.autoClose && this.type !== 'contact') {
      this.startAutoCloseTimer();
    }
  }

  ngOnDestroy(): void {
    this.clearAutoCloseTimer();
  }

  ngOnChanges(): void {
    if (this.show && this.autoClose && this.type !== 'contact') {
      this.startAutoCloseTimer();
    } else {
      this.clearAutoCloseTimer();
    }
  }

  handleClose(): void {
    this.show = false;
    this.showChange.emit(false);
    this.close.emit();
  }

  // Método para copiar información al portapapeles
  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copiado al portapapeles:', text);
    }).catch(err => {
      console.error('Error al copiar:', err);
    });
  }

  // Método para abrir WhatsApp
  openWhatsApp(): void {
    if (this.contactInfo?.phone) {
      const phone = this.contactInfo.phone.replace(/\D/g, ''); // Solo números
      const message = `Hola, me comunico por la observación del lote ${this.contactInfo.batchCode}`;
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    }
  }

  // Método para abrir email
  openEmail(): void {
    if (this.contactInfo?.email) {
      const subject = `Observación - Lote ${this.contactInfo.batchCode}`;
      const body = `Estimado/a ${this.contactInfo.supplierName},\n\nMe comunico con usted para coordinar la solución de la observación del lote ${this.contactInfo.batchCode}.\n\nQuedo atento/a a su respuesta.\n\nSaludos cordiales.`;
      const url = `mailto:${this.contactInfo.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(url);
    }
  }

  private startAutoCloseTimer(): void {
    this.clearAutoCloseTimer();
    this.timer = setTimeout(() => this.handleClose(), this.duration);
  }

  private clearAutoCloseTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
