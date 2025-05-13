import { TestBed } from '@angular/core/testing';

import { BusinessmanService } from './businessman.service';

describe('BusinessmanService', () => {
  let service: BusinessmanService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BusinessmanService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
