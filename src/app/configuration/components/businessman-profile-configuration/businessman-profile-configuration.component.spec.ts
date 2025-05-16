import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BusinessmanProfileConfigurationComponent } from './businessman-profile-configuration.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../../../auth/services/auth.service';
import { BusinessmanService } from '../../../businessman/services/businessman.service';
import { of } from 'rxjs';
import { Businessman } from '../../../businessman/models/businessman.entity';

describe('BusinessmanProfileConfigurationComponent', () => {
  let component: BusinessmanProfileConfigurationComponent;
  let fixture: ComponentFixture<BusinessmanProfileConfigurationComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let businessmanServiceSpy: jasmine.SpyObj<BusinessmanService>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    const businessmanSpy = jasmine.createSpyObj('BusinessmanService', 
      ['getProfileByUserId', 'update']);

    // Mock user data
    const mockUser = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      role: 'businessman',
      country: 'Peru',
      city: 'Lima',
      address: 'Test Address',
      phone: '123456789'
    };

    // Setup spy return values
    authSpy.getCurrentUser.and.returnValue(mockUser);
    businessmanSpy.update.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        HttpClientTestingModule,
        RouterTestingModule,
        BusinessmanProfileConfigurationComponent
      ],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: BusinessmanService, useValue: businessmanSpy }
      ]
    }).compileComponents();

    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    businessmanServiceSpy = TestBed.inject(BusinessmanService) as jasmine.SpyObj<BusinessmanService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BusinessmanProfileConfigurationComponent);
    component = fixture.componentInstance;
    
    // Mock the getProfileByUserId method to call the callback with a businessman profile
    businessmanServiceSpy.getProfileByUserId.and.callFake((userId, callback) => {
      if (callback) {
        const mockProfile = {
          id: 1,
          userId: 1,
          companyName: 'Test Company',
          ruc: '12345678901',
          businessType: 'Startup',
          industry: 'Technology',
          employeeCount: 10,
          foundingYear: 2020,
          website: 'https://example.com',
          description: 'Test description',
          logo: ''
        };
        callback(mockProfile);
      }
    });
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load businessman profile on init', () => {
    expect(businessmanServiceSpy.getProfileByUserId).toHaveBeenCalled();
    expect(component.profileForm.get('companyName')?.value).toBe('Test Company');
  });
});