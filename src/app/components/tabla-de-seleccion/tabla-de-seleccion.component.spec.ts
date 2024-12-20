import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablaDeSeleccionComponent } from './tabla-de-seleccion.component';

describe('TablaDeSeleccionComponent', () => {
  let component: TablaDeSeleccionComponent;
  let fixture: ComponentFixture<TablaDeSeleccionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaDeSeleccionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TablaDeSeleccionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
