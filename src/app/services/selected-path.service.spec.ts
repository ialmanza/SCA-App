import { TestBed } from '@angular/core/testing';

import { SelectedPathService } from './selected-path.service';

describe('SelectedPathService', () => {
  let service: SelectedPathService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SelectedPathService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
