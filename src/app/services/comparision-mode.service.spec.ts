import { TestBed } from '@angular/core/testing';

import { ComparisionModeService } from './comparision-mode.service';

describe('ComparisionModeService', () => {
  let service: ComparisionModeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ComparisionModeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
