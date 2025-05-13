// app-button.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatMenuModule, MatCheckboxModule,MatProgressSpinnerModule],
  templateUrl: './app-button.component.html',
  styleUrls: ['./app-button.component.css']
})
export class AppButtonComponent {
  @Input() label: string = '';
  @Input() icon: string = '';
  @Input() loading: boolean = false;
  @Input() disabled: boolean = false;
  @Input() variant: 'primary' | 'secondary' | 'text' | 'back' = 'primary';
  @Input() size: 'small' | 'normal' | 'large' = 'normal';
  @Input() fullWidth: boolean = false;
  @Input() type: 'button' | 'filter' = 'button';
  @Input() filterOptions: Array<{label: string, value: any}> = [];
  @Input() filterValue: Array<{label: string, value: any}> = [];

  @Output() click = new EventEmitter<Event>();
  @Output() filterValueChange = new EventEmitter<Array<{label: string, value: any}>>();
  @Output() filterApply = new EventEmitter<Array<{label: string, value: any}>>();

  isDropdownOpen = false;
  selectedFilters: Array<{label: string, value: any}> = [];

  ngOnInit() {
    this.selectedFilters = [...this.filterValue];
  }

  ngOnChanges() {
    if (this.filterValue) {
      this.selectedFilters = [...this.filterValue];
    }
  }

  handleClick(event: Event) {
    if (this.type === 'button') {
      this.click.emit(event);
    }
  }

  toggleFilterOption(option: {label: string, value: any}) {
    const index = this.selectedFilters.findIndex(item => item.value === option.value);

    if (index === -1) {
      // Añadir opción
      this.selectedFilters.push(option);
    } else {
      // Eliminar opción
      this.selectedFilters.splice(index, 1);
    }

    this.filterValueChange.emit([...this.selectedFilters]);
  }

  isFilterSelected(option: {label: string, value: any}): boolean {
    return this.selectedFilters.some(item => item.value === option.value);
  }

  clearFilters() {
    this.selectedFilters = [];
    this.filterValueChange.emit([]);
  }

  applyFilters() {
    this.filterApply.emit([...this.selectedFilters]);
  }
}
