import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessmanBatchComponent } from './businessman-batch.component';

describe('BusinessmanBatchComponent', () => {
  let component: BusinessmanBatchComponent;
  let fixture: ComponentFixture<BusinessmanBatchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessmanBatchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BusinessmanBatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
