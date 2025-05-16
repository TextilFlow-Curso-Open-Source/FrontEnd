import { TestBed } from '@angular/core/testing';

import { SupplierRequestServiceService } from './supplier-request-service.service';

describe('SupplierRequestServiceService', () => {
  let service: SupplierRequestServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SupplierRequestServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
