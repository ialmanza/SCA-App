import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PuntuacionesMinimasComponent } from './puntuaciones-minimas.component';

describe('PuntuacionesMinimasComponent', () => {
  let component: PuntuacionesMinimasComponent;
  let fixture: ComponentFixture<PuntuacionesMinimasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PuntuacionesMinimasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PuntuacionesMinimasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
