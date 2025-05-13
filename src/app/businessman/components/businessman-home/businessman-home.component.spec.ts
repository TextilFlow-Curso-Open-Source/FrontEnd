import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessmanHomeComponent } from './businessman-home.component';

describe('BusinessmanHomeComponent', () => {
  let component: BusinessmanHomeComponent;
  let fixture: ComponentFixture<BusinessmanHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessmanHomeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BusinessmanHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
