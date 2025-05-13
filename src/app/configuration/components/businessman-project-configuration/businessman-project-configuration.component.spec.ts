import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessmanProjectConfigurationComponent } from './businessman-project-configuration.component';

describe('BusinessmanProjectConfigurationComponent', () => {
  let component: BusinessmanProjectConfigurationComponent;
  let fixture: ComponentFixture<BusinessmanProjectConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessmanProjectConfigurationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BusinessmanProjectConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
