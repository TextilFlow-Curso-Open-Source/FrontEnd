import { ComponentFixture, TestBed } from '@angular/core/testing';

import {BusinessmanConfigurationComponent} from './businessman-configuration.component';

describe('BusinessmanConfigurationComponent', () => {
  let component: BusinessmanConfigurationComponent;
  let fixture: ComponentFixture<BusinessmanConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessmanConfigurationComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(BusinessmanConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
