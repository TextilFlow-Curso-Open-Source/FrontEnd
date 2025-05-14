import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { BatchService } from '../../services/batch.service.service';
import { Batch, STATUS } from '../../models/batch.entity';
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
      const supplierBatches = batches.filter(b => b.supplierId === this.currentUserId);
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

    const updatedBatch: Batch = {
      ...batch,
      status: updatedStatus
    };

    this.batchService.update(updatedBatch.id!, updatedBatch).subscribe(() => {
      this.loadBatches();
    });
  }

  editBatch(batch: Batch): void {
    this.selectedBatch = { ...batch };

    // Resetear el formulario reactivo con los datos del batch
    this.editForm = this.fb.group({
      code: [batch.code, Validators.required],
      client: [batch.client, Validators.required],
      fabricType: [batch.fabricType, Validators.required],
      color: [batch.color],
      quantity: [batch.quantity, [Validators.required, Validators.min(1)]],
      price: [batch.price, [Validators.required, Validators.min(0)]],
      observations: [batch.observations],
      date: [batch.date, Validators.required]
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

    const updatedBatch = {
      ...this.selectedBatch,
      ...this.editForm.value
    };

    this.batchService.update(updatedBatch.id!, updatedBatch).subscribe({
      next: () => {
        this.showEditSuccess=true;
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
}
