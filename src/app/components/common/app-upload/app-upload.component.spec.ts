import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppUploadComponent } from './app-upload.component';

describe('AppUploadComponent', () => {
  let component: AppUploadComponent;
  let fixture: ComponentFixture<AppUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppUploadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
