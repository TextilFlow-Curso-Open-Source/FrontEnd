// supplier-batch.component.ts modificado
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { BatchService } from '../../services/batch.service.service';
import { Batch, STATUS, BatchStatus } from '../../models/batch.entity';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AppInputComponent } from '../../../core/components/app-input/app-input.component';
import { AppButtonComponent } from '../../../core/components/app-button/app-button.component';
import { AppNotificationComponent } from '../../../core/components/app-notification/app-notification.component';

@Component({
  selector: 'app-supplier-batch',
  standalone: true,
  templateUrl: './supplier-batch.component.html',
  styleUrls: ['./supplier-batch.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    AppInputComponent,
    AppButtonComponent,
    AppNotificationComponent
  ]
})
export class SupplierBatchComponent implements OnInit {
  displayedColumns: string[] = ['code', 'client', 'fabricType', 'date', 'status', 'price', 'actions'];
  dataSource: MatTableDataSource<Batch> = new MatTableDataSource<Batch>();

  editMode = false;
  selectedBatch: Batch | null = null;
  editForm!: FormGroup;

  showEditSuccess = false;
  showEditError = false;
  showEditCancel = false;

  // Estados disponibles para el selector
  statusOptions = [
    { label: 'Aceptado', value: STATUS.ACEPTADO },
    { label: 'Completado', value: STATUS.COMPLETADO },
    { label: 'Por Enviar', value: STATUS.POR_ENVIAR },
    { label: 'Enviado', value: STATUS.ENVIADO }
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  currentUserId!: number;

  constructor(
    private batchService: BatchService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.currentUserId = currentUser.id;
      this.loadBatches();
    }
  }

  loadBatches(): void {
    this.batchService.getAll().subscribe(batches => {
      // Filtrar lotes del proveedor actual y excluir los de estado PENDIENTE
      const supplierBatches = batches.filter(b =>
        b.supplierId === this.currentUserId &&
        b.status !== STATUS.PENDIENTE
      );

      this.dataSource = new MatTableDataSource(supplierBatches);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
  }

  toggleStatus(batch: Batch): void {
    const updatedStatus = batch.status === STATUS.ENVIADO ? STATUS.POR_ENVIAR : STATUS.ENVIADO;

    const updatedBatch: Partial<Batch> = {
      ...batch,
      status: updatedStatus
    };

    this.batchService.update(batch.id!, updatedBatch).subscribe(() => {
      this.loadBatches();
    });
  }

  editBatch(batch: Batch): void {
    this.selectedBatch = { ...batch };

    // Crear formulario con todos los campos deshabilitados excepto observaciones y estado
    this.editForm = this.fb.group({
      code: [{value: batch.code, disabled: true}, Validators.required],
      client: [{value: batch.client, disabled: true}, Validators.required],
      fabricType: [{value: batch.fabricType, disabled: true}, Validators.required],
      color: [{value: batch.color, disabled: true}],
      quantity: [{value: batch.quantity, disabled: true}, [Validators.required, Validators.min(1)]],
      price: [{value: batch.price, disabled: true}, [Validators.required, Validators.min(0)]],
      observations: [batch.observations], // Este campo SÍ es editable
      date: [{value: batch.date, disabled: true}, Validators.required],
      status: [batch.status, Validators.required] // Este campo SÍ es editable
    });

    //Importante: resetear notificaciones
    this.showEditSuccess = false;
    this.showEditError = false;
    this.showEditCancel = false;

    this.editMode = true;
  }

  cancelEdit(): void {
    this.showEditCancel = true;

    setTimeout(() => {
      this.editMode = false;
      this.selectedBatch = null;
      this.editForm.reset();
    }, 300); // ligeramente menor que el autoClose
  }

  onEditSubmit(): void {
    if (!this.editForm.valid || !this.selectedBatch) return;

    // Solo actualizar los campos editables pero preservar businessmanId
    const updatedBatch: Partial<Batch> = {
      id: this.selectedBatch.id,
      status: this.editForm.get('status')?.value as BatchStatus,
      observations: this.editForm.get('observations')?.value,
      businessmanId: this.selectedBatch.businessmanId // Preservar el businessmanId
    };

    this.batchService.update(updatedBatch.id!, updatedBatch).subscribe({
      next: () => {
        this.showEditSuccess = true;
        this.loadBatches();
        this.editMode = false;
        this.selectedBatch = null;
      },
      error: () => {
        this.showEditError = true;
      }
    });
  }

  goToDetail(batch: Batch): void {
    this.router.navigate(['/supplier-batch', batch.id]);
  }

  downloadCSV(): void {
    const csv = this.dataSource.filteredData.map(b => {
      return `${b.code},${b.client},${b.fabricType},${b.color},${b.date},${b.status},${b.price}`;
    });
    const content = ['Código,Cliente,Tipo de tela,Color,Fecha,Estado,Precio', ...csv].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'lotes.csv';
    link.click();
  }

  // Método helper para obtener colores de estado
  getStatusClass(status: string): string {
    switch (status) {
      case STATUS.ENVIADO:
        return 'status-green';
      case STATUS.POR_ENVIAR:
        return 'status-yellow';
      case STATUS.ACEPTADO:
        return 'status-blue';
      case STATUS.COMPLETADO:
        return 'status-purple';
      case STATUS.RECHAZADO:
        return 'status-red';
      default:
        return '';
    }
  }
}
