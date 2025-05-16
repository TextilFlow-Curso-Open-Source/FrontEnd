import { TestBed } from '@angular/core/testing';

import { SupplierReviewService } from './supplier-review.service';

describe('SupplierReviewService', () => {
  let service: SupplierReviewService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SupplierReviewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
