import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierProfileConfigurationComponent } from './supplier-profile-configuration.component';

describe('SupplierProfileConfigurationComponent', () => {
  let component: SupplierProfileConfigurationComponent;
  let fixture: ComponentFixture<SupplierProfileConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplierProfileConfigurationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupplierProfileConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
