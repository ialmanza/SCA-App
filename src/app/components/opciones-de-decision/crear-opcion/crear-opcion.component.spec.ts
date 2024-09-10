import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearOpcionComponent } from './crear-opcion.component';

describe('CrearOpcionComponent', () => {
  let component: CrearOpcionComponent;
  let fixture: ComponentFixture<CrearOpcionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearOpcionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearOpcionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
