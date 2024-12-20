import { TestBed } from '@angular/core/testing';

import { ComparisonCellService } from './comparison-cell.service';

describe('ComparisonCellService', () => {
  let service: ComparisonCellService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ComparisonCellService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
