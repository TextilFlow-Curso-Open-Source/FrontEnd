import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessmanRequestComponent } from './businessman-request.component';

describe('BusinessmanRequestComponent', () => {
  let component: BusinessmanRequestComponent;
  let fixture: ComponentFixture<BusinessmanRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessmanRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BusinessmanRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
