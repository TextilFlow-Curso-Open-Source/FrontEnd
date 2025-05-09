import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObservationsTableComponent } from './observations-table.component';

describe('ObservationsTableComponent', () => {
  let component: ObservationsTableComponent;
  let fixture: ComponentFixture<ObservationsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObservationsTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ObservationsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
