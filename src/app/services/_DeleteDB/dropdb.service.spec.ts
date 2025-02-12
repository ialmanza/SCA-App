import { TestBed } from '@angular/core/testing';

import { DropdbService } from './dropdb.service';

describe('DropdbService', () => {
  let service: DropdbService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DropdbService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
