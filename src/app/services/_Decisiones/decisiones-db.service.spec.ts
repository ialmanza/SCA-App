import { TestBed } from '@angular/core/testing';

import { DecisionesDBService } from './decisiones-db.service';

describe('DecisionesDBService', () => {
  let service: DecisionesDBService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DecisionesDBService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
