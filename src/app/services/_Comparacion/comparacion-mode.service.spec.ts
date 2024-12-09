import { TestBed } from '@angular/core/testing';

import { ComparacionModeService } from './comparacion-mode.service';

describe('ComparacionModeService', () => {
  let service: ComparacionModeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ComparacionModeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
