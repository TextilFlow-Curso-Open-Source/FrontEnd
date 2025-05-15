import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SupplierProfileConfigurationComponent } from './supplier-profile-configuration.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../../../auth/services/auth.service';
import { SupplierService } from '../../../supplier/services/supplier.service';
import { ConfigurationServiceService } from '../../services/configuration.service.service';
import { of } from 'rxjs';
import { Supplier } from '../../../supplier/models/supplier.entity';
import { Configuration } from '../../models/configuration.entity';

describe('SupplierProfileConfigurationComponent', () => {
  let component: SupplierProfileConfigurationComponent;
  let fixture: ComponentFixture<SupplierProfileConfigurationComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let supplierServiceSpy: jasmine.SpyObj<SupplierService>;
  let configServiceSpy: jasmine.SpyObj<ConfigurationServiceService>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    const supplierSpy = jasmine.createSpyObj('SupplierService', 
      ['getProfileByUserId', 'update']);
    const configSpy = jasmine.createSpyObj('ConfigurationServiceService',
      ['getUserConfiguration', 'saveConfiguration', 'resetConfiguration']);

    // Mock user data
    const mockUser = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      role: 'supplier',
      country: 'Peru',
      city: 'Lima',
      address: 'Test Address',
      phone: '123456789'
    };

    // Mock configuration data
    const mockConfig = new Configuration(1, 'supplier', {
      theme: 'light',
      language: 'es',
      emailNotifications: true,
      pushNotifications: true,
      dashboardLayout: {
        showWelcomeMessage: true,
        defaultView: 'list',
        widgetsOrder: ['summary', 'recent', 'notifications']
      },
      privacySettings: {
        profileVisibility: 'public',
        shareData: true
      }
    });

    // Setup spy return values
    authSpy.getCurrentUser.and.returnValue(mockUser);
    supplierSpy.update.and.returnValue(of({}));
    configSpy.getUserConfiguration.and.returnValue(of(mockConfig));
    configSpy.saveConfiguration.and.returnValue(of(mockConfig));
    configSpy.resetConfiguration.and.returnValue(of(mockConfig));

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        HttpClientTestingModule,
        RouterTestingModule,
        SupplierProfileConfigurationComponent
      ],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: SupplierService, useValue: supplierSpy },
        { provide: ConfigurationServiceService, useValue: configSpy }
      ]
    }).compileComponents();

    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    supplierServiceSpy = TestBed.inject(SupplierService) as jasmine.SpyObj<SupplierService>;
    configServiceSpy = TestBed.inject(ConfigurationServiceService) as jasmine.SpyObj<ConfigurationServiceService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SupplierProfileConfigurationComponent);
    component = fixture.componentInstance;
    
    // Mock the getProfileByUserId method to call the callback with a supplier profile
    supplierServiceSpy.getProfileByUserId.and.callFake((userId, callback) => {
      if (callback) {
        const mockProfile = {
          id: 1,
          userId: 1,
          companyName: 'Test Supplier',
          ruc: '12345678901',
          specialization: 'Materias Primas',
          productCategories: ['Electrónica', 'Plásticos y Polímeros'],
          yearsFounded: 2020,
          warehouseLocation: 'Lima, Peru',
          minimumOrderQuantity: 100,
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

  it('should load supplier profile on init', () => {
    expect(supplierServiceSpy.getProfileByUserId).toHaveBeenCalled();
    expect(component.profileForm.get('companyName')?.value).toBe('Test Supplier');
  });

  it('should load configuration on init', () => {
    expect(configServiceSpy.getUserConfiguration).toHaveBeenCalledWith(1, 'supplier');
    expect(component.configForm.get('theme')?.value).toBe('light');
    expect(component.configForm.get('language')?.value).toBe('es');
  });

  it('should save configuration when saveConfiguration is called', () => {
    // Set new values in the form
    component.configForm.patchValue({
      theme: 'dark',
      language: 'en'
    });

    // Call the save method
    component.saveConfiguration();

    // Verify the service was called with the updated values
    expect(configServiceSpy.saveConfiguration).toHaveBeenCalled();
    const savedConfig = configServiceSpy.saveConfiguration.calls.mostRecent().args[0];
    expect(savedConfig.theme).toBe('dark');
    expect(savedConfig.language).toBe('en');
  });

  it('should reset configuration when resetConfiguration is called', () => {
    // Mock the confirm dialog to return true
    spyOn(window, 'confirm').and.returnValue(true);
    
    // Call the reset method
    component.resetConfiguration();

    // Verify the service was called
    expect(configServiceSpy.resetConfiguration).toHaveBeenCalledWith(1, 'supplier');
  });

  it('should switch between tabs when setActiveTab is called', () => {
    // Default should be profile
    expect(component.activeTab).toBe('profile');
    
    // Switch to config tab
    component.setActiveTab('config');
    expect(component.activeTab).toBe('config');
    
    // Switch back to profile tab
    component.setActiveTab('profile');
    expect(component.activeTab).toBe('profile');
  });
