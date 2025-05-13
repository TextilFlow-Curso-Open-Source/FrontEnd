import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessmanObservationComponent } from './businessman-observation.component';

describe('BusinessmanObservationComponent', () => {
  let component: BusinessmanObservationComponent;
  let fixture: ComponentFixture<BusinessmanObservationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessmanObservationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BusinessmanObservationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
