import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ConfigurationServiceService } from './configuration.service.service';
import { Configuration } from '../models/configuration.entity';
import { environment } from '../../../environments/environment';

describe('ConfigurationServiceService', () => {
  let service: ConfigurationServiceService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.serverBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ConfigurationServiceService]
    });
    service = TestBed.inject(ConfigurationServiceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getUserConfiguration', () => {
    it('should return existing configuration when found', () => {
      const userId = 1;
      const userRole = 'businessman';
      const mockConfig = new Configuration(userId, userRole, { id: 123, theme: 'dark' });

      service.getUserConfiguration(userId, userRole).subscribe(config => {
        expect(config).toBeTruthy();
        expect(config.id).toBe(123);
        expect(config.userId).toBe(userId);
        expect(config.userRole).toBe(userRole);
        expect(config.theme).toBe('dark');
      });

      const req = httpMock.expectOne(`${apiUrl}/configurations?userId=${userId}`);
      expect(req.request.method).toBe('GET');
      req.flush([mockConfig]);
    });

    it('should return default configuration when none exists', () => {
      const userId = 1;
      const userRole = 'businessman';

      service.getUserConfiguration(userId, userRole).subscribe(config => {
        expect(config).toBeTruthy();
        expect(config.id).toBeUndefined();
        expect(config.userId).toBe(userId);
        expect(config.userRole).toBe(userRole);
        expect(config.theme).toBe('light'); // Default theme
      });

      const req = httpMock.expectOne(`${apiUrl}/configurations?userId=${userId}`);
      expect(req.request.method).toBe('GET');
      req.flush([]); // Empty array, no configurations found
    });

    it('should handle errors and return default configuration', () => {
      const userId = 1;
      const userRole = 'businessman';

      service.getUserConfiguration(userId, userRole).subscribe(config => {
        expect(config).toBeTruthy();
        expect(config.userId).toBe(userId);
        expect(config.userRole).toBe(userRole);
      });

      const req = httpMock.expectOne(`${apiUrl}/configurations?userId=${userId}`);
      expect(req.request.method).toBe('GET');
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('saveConfiguration', () => {
    it('should create new configuration when no id exists', () => {
      const userId = 1;
      const userRole = 'businessman';
      const newConfig = new Configuration(userId, userRole);
      const savedConfig = { ...newConfig, id: 123 };

      service.saveConfiguration(newConfig).subscribe(config => {
        expect(config).toBeTruthy();
        expect(config.id).toBe(123);
      });

      const req = httpMock.expectOne(`${apiUrl}/configurations`);
      expect(req.request.method).toBe('POST');
      req.flush(savedConfig);
    });

    it('should update existing configuration when id exists', () => {
      const userId = 1;
      const userRole = 'businessman';
      const existingConfig = new Configuration(userId, userRole, { id: 123, theme: 'light' });
      const updatedConfig = { ...existingConfig, theme: 'dark' };

      service.saveConfiguration(existingConfig).subscribe(config => {
        expect(config).toBeTruthy();
        expect(config.id).toBe(123);
        expect(config.theme).toBe('dark');
      });

      const req = httpMock.expectOne(`${apiUrl}/configurations/123`);
      expect(req.request.method).toBe('PUT');
      req.flush(updatedConfig);
    });
  });

  describe('resetConfiguration', () => {
    it('should reset configuration to defaults', () => {
      const userId = 1;
      const userRole = 'businessman';
      const existingConfig = new Configuration(userId, userRole, { 
        id: 123, 
        theme: 'dark',
        language: 'en',
        emailNotifications: false
      });

      // First get the existing config
      service.resetConfiguration(userId, userRole).subscribe(config => {
        expect(config).toBeTruthy();
        expect(config.id).toBe(123);
        expect(config.theme).toBe('light'); // Reset to default
        expect(config.language).toBe('es'); // Reset to default
        expect(config.emailNotifications).toBe(true); // Reset to default
      });

      const getReq = httpMock.expectOne(`${apiUrl}/configurations?userId=${userId}`);
      expect(getReq.request.method).toBe('GET');
      getReq.flush([existingConfig]);
    });
  });
});
