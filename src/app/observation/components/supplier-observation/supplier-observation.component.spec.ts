import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierObservationComponent } from './supplier-observation.component';

describe('SupplierObservationComponent', () => {
  let component: SupplierObservationComponent;
  let fixture: ComponentFixture<SupplierObservationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplierObservationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupplierObservationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
