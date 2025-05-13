import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatDatepickerModule, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { AppButtonComponent } from '../app-button/app-button.component';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    AppButtonComponent
  ],
  templateUrl: './app-input.component.html',
  styleUrls: ['./app-input.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppInputComponent),
      multi: true
    }
  ]
})
export class AppInputComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() type: 'text' | 'number' | 'email' | 'password' | 'date' | 'tel' | 'url' | 'search' | 'textarea' | 'select' | 'file' | 'photo' = 'text';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() error: string = '';
  @Input() options: Array<{label: string, value: any}> = [];
  @Input() fullWidth: boolean = false;

  @Output() focus = new EventEmitter<FocusEvent>();
  @Output() blur = new EventEmitter<FocusEvent>();
  @Output() change = new EventEmitter<any>();

  value: any = '';
  photoPreviewUrl: string = '';
  selectedFile: File | null = null;

  onChange: any = () => {};
  onTouched: any = () => {};

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    this.value = value;

    // Si es una foto y hay valor, crear URL de vista previa
    if (this.type === 'photo' && value instanceof File) {
      this.photoPreviewUrl = URL.createObjectURL(value);
      this.selectedFile = value;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // Métodos específicos para cada tipo de evento
  updateValue(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    this.value = target.value;
    this.onChange(this.value);
    this.change.emit(this.value);
  }

  // Método para manejar el cambio del select de Material
  updateSelectValue(event: MatSelectChange): void {
    this.value = event.value;
    this.onChange(this.value);
    this.change.emit(this.value);
  }

  // Método para manejar el cambio de fecha del datepicker de Material
  updateDateValue(event: MatDatepickerInputEvent<any>): void {
    this.value = event.value;
    this.onChange(this.value);
    this.change.emit(this.value);
  }

  handleFocus(event: FocusEvent): void {
    this.focus.emit(event);
  }

  handleBlur(event: FocusEvent): void {
    this.onTouched();
    this.blur.emit(event);
  }

  handleFileSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.value = file;
      this.onChange(file);
      this.change.emit(file);

      // Si es una foto, crear URL de vista previa
      if (this.type === 'photo') {
        this.photoPreviewUrl = URL.createObjectURL(file);
      }
    }
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }
}
