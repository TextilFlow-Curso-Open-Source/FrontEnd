import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierBatchComponent } from './supplier-batch.component';

describe('SupplierBatchComponent', () => {
  let component: SupplierBatchComponent;
  let fixture: ComponentFixture<SupplierBatchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplierBatchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupplierBatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
