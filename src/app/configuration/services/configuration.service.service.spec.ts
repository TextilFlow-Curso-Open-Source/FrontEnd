import { TestBed } from '@angular/core/testing';

import { ConfigurationServiceService } from './configuration.service.service';

describe('ConfigurationServiceService', () => {
  let service: ConfigurationServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfigurationServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
