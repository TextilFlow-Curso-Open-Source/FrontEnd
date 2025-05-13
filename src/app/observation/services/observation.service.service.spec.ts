import { TestBed } from '@angular/core/testing';

import { ObservationServiceService } from './observation.service.service';

describe('ObservationServiceService', () => {
  let service: ObservationServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ObservationServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
