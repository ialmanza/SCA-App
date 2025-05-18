import { TestBed } from '@angular/core/testing';

import { PathAreaScoreService } from './path-area-score.service';

describe('PathAreaScoreService', () => {
  let service: PathAreaScoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PathAreaScoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
