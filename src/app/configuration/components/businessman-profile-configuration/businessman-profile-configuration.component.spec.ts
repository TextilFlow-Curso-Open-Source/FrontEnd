import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessmanProfileConfigurationComponent } from './businessman-profile-configuration.component';

describe('BusinessmanProfileConfigurationComponent', () => {
  let component: BusinessmanProfileConfigurationComponent;
  let fixture: ComponentFixture<BusinessmanProfileConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessmanProfileConfigurationComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(BusinessmanProfileConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
