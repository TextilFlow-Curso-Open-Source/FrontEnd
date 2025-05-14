// core/components/app-notification/app-notification.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppButtonComponent } from '../app-button/app-button.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule, AppButtonComponent,MatIconModule],
  templateUrl: './app-notification.component.html',
  styleUrls: ['./app-notification.component.css']
})
export class AppNotificationComponent implements OnInit, OnDestroy {
  @Input() show: boolean = false;
  @Input() message: string = 'Operación completada';
  @Input() type: 'success' | 'error' | 'warning' | 'info' = 'success';
  @Input() autoClose: boolean = false;
  @Input() duration: number = 3000;
  @Input() buttonText: string = 'Aceptar';

  @Output() showChange = new EventEmitter<boolean>();
  @Output() close = new EventEmitter<void>();

  timer: any;

  ngOnInit(): void {
    if (this.show && this.autoClose) {
      this.startAutoCloseTimer();
    }
  }

  ngOnDestroy(): void {
    this.clearAutoCloseTimer();
  }

  ngOnChanges(): void {
    if (this.show && this.autoClose) {
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
