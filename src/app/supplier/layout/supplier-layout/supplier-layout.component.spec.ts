import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierLayoutComponent } from './supplier-layout.component';

describe('SupplierLayoutComponent', () => {
  let component: SupplierLayoutComponent;
  let fixture: ComponentFixture<SupplierLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplierLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupplierLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
