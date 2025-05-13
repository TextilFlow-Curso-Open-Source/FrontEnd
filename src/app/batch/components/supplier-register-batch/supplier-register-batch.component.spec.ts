import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierRegisterBatchComponent } from './supplier-register-batch.component';

describe('SupplierRegisterBatchComponent', () => {
  let component: SupplierRegisterBatchComponent;
  let fixture: ComponentFixture<SupplierRegisterBatchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplierRegisterBatchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupplierRegisterBatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
