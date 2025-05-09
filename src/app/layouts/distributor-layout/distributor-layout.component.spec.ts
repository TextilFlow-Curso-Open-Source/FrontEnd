import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DistributorLayoutComponent } from './distributor-layout.component';

describe('DistributorLayoutComponent', () => {
  let component: DistributorLayoutComponent;
  let fixture: ComponentFixture<DistributorLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DistributorLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DistributorLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
