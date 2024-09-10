import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListarOpcionesComponent } from './listar-opciones.component';

describe('ListarOpcionesComponent', () => {
  let component: ListarOpcionesComponent;
  let fixture: ComponentFixture<ListarOpcionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListarOpcionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListarOpcionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
