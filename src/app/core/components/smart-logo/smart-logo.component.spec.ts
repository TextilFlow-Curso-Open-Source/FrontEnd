import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmartLogoComponent } from './smart-logo.component';

describe('SmartLogoComponent', () => {
  let component: SmartLogoComponent;
  let fixture: ComponentFixture<SmartLogoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmartLogoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SmartLogoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
