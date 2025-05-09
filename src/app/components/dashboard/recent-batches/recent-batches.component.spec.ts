import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecentBatchesComponent } from './recent-batches.component';

describe('RecentBatchesComponent', () => {
  let component: RecentBatchesComponent;
  let fixture: ComponentFixture<RecentBatchesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentBatchesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecentBatchesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
