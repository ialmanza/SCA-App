import { TestBed } from '@angular/core/testing';

import { VinculodbService } from './vinculodb.service';

describe('VinculodbService', () => {
  let service: VinculodbService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VinculodbService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
