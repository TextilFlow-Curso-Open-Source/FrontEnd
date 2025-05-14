import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { BatchService } from '../../services/batch.service.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Batch } from '../../models/batch.entity';

import { AppInputComponent } from '../../../core/components/app-input/app-input.component';
import { AppButtonComponent } from '../../../core/components/app-button/app-button.component';
import { AppNotificationComponent } from '../../../core/components/app-notification/app-notification.component';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-supplier-register-batch',
  standalone: true,
  templateUrl: './supplier-register-batch.component.html',
  styleUrls: ['./supplier-register-batch.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppInputComponent,
    AppButtonComponent,
    AppNotificationComponent,
    MatIconModule //
  ]
})

export class SupplierRegisterBatchComponent implements OnInit {
  form!: FormGroup;
  showNotification = false;
  showSuccessNotification = false;
  showErrorNotification = false;
  showWarningNotification = false;
  showCancelNotification = false;

  constructor(
    private fb: FormBuilder,
    private batchService: BatchService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      code: ['', Validators.required],
      client: ['', Validators.required],
      fabricType: ['', Validators.required],
      color: ['', Validators.required],
      quantity: [0, [Validators.required, Validators.min(1)]],
      price: [0, [Validators.required, Validators.min(0)]],
      observations: [''],
      date: [new Date().toISOString().slice(0, 10), Validators.required],
      imageUrl: [''] // lo podés cambiar luego si agregás soporte para fotos
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showWarningNotification = true;
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      console.error('Usuario no autenticado');
      this.showErrorNotification = true; // 👈 mostramos error real
      return;
    }

    const batch: Batch = {
      ...this.form.value,
      status: 'Por enviar',
      supplierId: currentUser.id
    };

    this.batchService.create(batch).subscribe({
      next: () => {
        this.showSuccessNotification = true; // ✅ aquí sí mostramos éxito
        this.form.reset();
      },
      error: () => {
        this.showErrorNotification = true;
      }
    });
  }
  onCancel(): void {
    this.form.reset();
    this.showWarningNotification = false;
    this.showSuccessNotification = false;
    this.showErrorNotification = false;
    this.showCancelNotification = true;
  }





}
