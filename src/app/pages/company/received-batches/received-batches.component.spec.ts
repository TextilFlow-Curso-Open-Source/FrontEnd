import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceivedBatchesComponent } from './received-batches.component';

describe('ReceivedBatchesComponent', () => {
  let component: ReceivedBatchesComponent;
  let fixture: ComponentFixture<ReceivedBatchesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceivedBatchesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReceivedBatchesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
