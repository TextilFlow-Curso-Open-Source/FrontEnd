import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BusinessmanConfigurationComponent } from './businessman-configuration.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ConfigurationServiceService } from '../../services/configuration.service.service';
import { AuthService } from '../../../auth/services/auth.service';
import { of } from 'rxjs';
import { Configuration } from '../../models/configuration.entity';

describe('BusinessmanConfigurationComponent', () => {
  let component: BusinessmanConfigurationComponent;
  let fixture: ComponentFixture<BusinessmanConfigurationComponent>;
  let configServiceSpy: jasmine.SpyObj<ConfigurationServiceService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const configSpy = jasmine.createSpyObj('ConfigurationServiceService', 
      ['getUserConfiguration', 'saveConfiguration', 'resetConfiguration']);
    const authSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);

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

    // Mock configuration data
    const mockConfig = new Configuration(1, 'businessman');

    // Setup spy return values
    authSpy.getCurrentUser.and.returnValue(mockUser);
    configSpy.getUserConfiguration.and.returnValue(of(mockConfig));
    configSpy.saveConfiguration.and.returnValue(of(mockConfig));
    configSpy.resetConfiguration.and.returnValue(of(mockConfig));

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        HttpClientTestingModule,
        RouterTestingModule,
        BusinessmanConfigurationComponent
      ],
      providers: [
        { provide: ConfigurationServiceService, useValue: configSpy },
        { provide: AuthService, useValue: authSpy }
      ]
    }).compileComponents();

    configServiceSpy = TestBed.inject(ConfigurationServiceService) as jasmine.SpyObj<ConfigurationServiceService>;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BusinessmanConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load user configuration on init', () => {
    expect(configServiceSpy.getUserConfiguration).toHaveBeenCalledWith(1, 'businessman');
  });
});