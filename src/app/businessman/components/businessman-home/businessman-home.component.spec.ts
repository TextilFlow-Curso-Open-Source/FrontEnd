import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BusinessmanHomeComponent } from './businessman-home.component';
import { By } from '@angular/platform-browser';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('BusinessmanHomeComponent', () => {
  let component: BusinessmanHomeComponent;
  let fixture: ComponentFixture<BusinessmanHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessmanHomeComponent],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BusinessmanHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the businessman name', () => {
    const welcomeElement = fixture.debugElement.query(By.css('.welcome-section h1')).nativeElement;
    expect(welcomeElement.textContent).toContain('Nome');
  });

  it('should display the correct lot summary', () => {
    const statElements = fixture.debugElement.queryAll(By.css('.stat-number'));
    expect(statElements[0].nativeElement.textContent).toContain('4 lotes');
    expect(statElements[1].nativeElement.textContent).toContain('12 lotes');
    expect(statElements[2].nativeElement.textContent).toContain('8 lotes');
    expect(statElements[3].nativeElement.textContent).toContain('8 lotes');
  });

  it('should display notifications', () => {
    const notificationItems = fixture.debugElement.queryAll(By.css('.notifications-list li'));
    expect(notificationItems.length).toBe(3);
  });

  it('should call viewDetails when details button is clicked', () => {
    spyOn(component, 'viewDetails');
    const detailsButton = fixture.debugElement.queryAll(By.css('.btn-details'))[0];
    detailsButton.triggerEventHandler('click', null);
    expect(component.viewDetails).toHaveBeenCalledWith('Pendientes');
  });

});
