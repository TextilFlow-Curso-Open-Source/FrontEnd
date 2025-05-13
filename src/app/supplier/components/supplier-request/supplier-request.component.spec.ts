import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierRequestComponent } from './supplier-request.component';

describe('SupplierRequestComponent', () => {
  let component: SupplierRequestComponent;
  let fixture: ComponentFixture<SupplierRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplierRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupplierRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
