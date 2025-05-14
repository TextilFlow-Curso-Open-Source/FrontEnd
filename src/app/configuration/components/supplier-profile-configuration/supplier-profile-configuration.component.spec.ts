import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SupplierProfileConfigurationComponent } from './supplier-profile-configuration.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../../../auth/services/auth.service';
import { SupplierService } from '../../../supplier/services/supplier.service';
import { of } from 'rxjs';
import { Supplier } from '../../../supplier/models/supplier.entity';

describe('SupplierProfileConfigurationComponent', () => {
  let component: SupplierProfileConfigurationComponent;
  let fixture: ComponentFixture<SupplierProfileConfigurationComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let supplierServiceSpy: jasmine.SpyObj<SupplierService>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    const supplierSpy = jasmine.createSpyObj('SupplierService', 
      ['getProfileByUserId', 'update']);

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

    // Setup spy return values
    authSpy.getCurrentUser.and.returnValue(mockUser);
    supplierSpy.update.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        HttpClientTestingModule,
        RouterTestingModule,
        SupplierProfileConfigurationComponent
      ],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: SupplierService, useValue: supplierSpy }
      ]
    }).compileComponents();

    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    supplierServiceSpy = TestBed.inject(SupplierService) as jasmine.SpyObj<SupplierService>;
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
});
