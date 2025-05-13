import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessmanLayoutComponent } from './businessman-layout.component';

describe('BusinessmanLayoutComponent', () => {
  let component: BusinessmanLayoutComponent;
  let fixture: ComponentFixture<BusinessmanLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessmanLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BusinessmanLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
