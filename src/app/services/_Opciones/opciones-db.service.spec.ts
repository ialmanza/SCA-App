import { TestBed } from '@angular/core/testing';

import { OpcionesDBService } from './opciones-db.service';

describe('OpcionesDBService', () => {
  let service: OpcionesDBService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpcionesDBService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
