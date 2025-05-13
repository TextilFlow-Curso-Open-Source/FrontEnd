import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierConfigurationComponent } from './supplier-configuration.component';

describe('SupplierConfigurationComponent', () => {
  let component: SupplierConfigurationComponent;
  let fixture: ComponentFixture<SupplierConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplierConfigurationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupplierConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
