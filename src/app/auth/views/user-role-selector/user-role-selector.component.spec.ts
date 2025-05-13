import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserRoleSelectorComponent } from './user-role-selector.component';

describe('UserRoleSelectorComponent', () => {
  let component: UserRoleSelectorComponent;
  let fixture: ComponentFixture<UserRoleSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserRoleSelectorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserRoleSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
