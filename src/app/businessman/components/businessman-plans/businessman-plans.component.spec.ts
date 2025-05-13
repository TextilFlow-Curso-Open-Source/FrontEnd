import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessmanPlansComponent } from './businessman-plans.component';

describe('BusinessmanPlansComponent', () => {
  let component: BusinessmanPlansComponent;
  let fixture: ComponentFixture<BusinessmanPlansComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessmanPlansComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BusinessmanPlansComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
