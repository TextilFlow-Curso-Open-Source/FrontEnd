import { TestBed } from '@angular/core/testing';

import { BatchServiceService } from './batch.service.service';

describe('BatchServiceService', () => {
  let service: BatchServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BatchServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
