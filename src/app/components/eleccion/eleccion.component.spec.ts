import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EleccionComponent } from './eleccion.component';

describe('EleccionComponent', () => {
  let component: EleccionComponent;
  let fixture: ComponentFixture<EleccionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EleccionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EleccionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
