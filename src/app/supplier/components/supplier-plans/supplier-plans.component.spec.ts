import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierPlansComponent } from './supplier-plans.component';

describe('SupplierPlansComponent', () => {
  let component: SupplierPlansComponent;
  let fixture: ComponentFixture<SupplierPlansComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplierPlansComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupplierPlansComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
