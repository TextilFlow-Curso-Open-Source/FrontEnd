import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BatchFormComponent } from './batch-form.component';

describe('BatchFormComponent', () => {
  let component: BatchFormComponent;
  let fixture: ComponentFixture<BatchFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatchFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BatchFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
