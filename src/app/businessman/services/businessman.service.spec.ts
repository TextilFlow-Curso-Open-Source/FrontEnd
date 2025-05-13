import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BusinessmanService } from './businessman.service';
import { Businessman } from '../models/businessman.entity';
import { environment } from '../../../environments/environment';

describe('BusinessmanService', () => {
  let service: BusinessmanService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BusinessmanService]
    });
    service = TestBed.inject(BusinessmanService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a businessman profile', () => {
    const userId = 1;
    service.createProfile(userId);

    const req = httpMock.expectOne(`${environment.serverBaseUrl}${environment.businessmanEndpointPath}`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.userId).toBe(userId);
    req.flush({ id: 1, userId: userId });
  });

  it('should get a businessman profile by user ID', () => {
    const userId = 1;
    const mockProfile = {
      id: 1,
      userId: userId,
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

    let result: Businessman | null = null;
    service.getProfileByUserId(userId, (profile) => {
      result = profile;
    });

    const req = httpMock.expectOne(`${environment.serverBaseUrl}${environment.businessmanEndpointPath}?userId=${userId}`);
    expect(req.request.method).toBe('GET');
    req.flush([mockProfile]);

    expect(result).toEqual(mockProfile);
  });

  it('should get a businessman profile by user ID as Observable', () => {
    const userId = 1;
    const mockProfile = {
      id: 1,
      userId: userId,
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

    service.getProfileByUserIdObservable(userId).subscribe(profile => {
      expect(profile).toEqual(mockProfile);
    });

    const req = httpMock.expectOne(`${environment.serverBaseUrl}${environment.businessmanEndpointPath}?userId=${userId}`);
    expect(req.request.method).toBe('GET');
    req.flush([mockProfile]);
  });

  it('should update a businessman profile', () => {
    const profileId = 1;
    const mockProfile = {
      id: profileId,
      userId: 1,
      companyName: 'Updated Company',
      ruc: '12345678901',
      businessType: 'Startup',
      industry: 'Technology',
      employeeCount: 10,
      foundingYear: 2020,
      website: 'https://example.com',
      description: 'Updated description',
      logo: ''
    };

    service.updateProfile(profileId, mockProfile).subscribe(profile => {
      expect(profile).toEqual(mockProfile);
    });

    const req = httpMock.expectOne(`${environment.serverBaseUrl}${environment.businessmanEndpointPath}/${profileId}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(JSON.stringify(mockProfile));
    req.flush(mockProfile);
  });
});
