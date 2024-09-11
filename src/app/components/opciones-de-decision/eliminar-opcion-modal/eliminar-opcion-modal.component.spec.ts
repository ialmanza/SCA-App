import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EliminarOpcionModalComponent } from './eliminar-opcion-modal.component';

describe('EliminarOpcionModalComponent', () => {
  let component: EliminarOpcionModalComponent;
  let fixture: ComponentFixture<EliminarOpcionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EliminarOpcionModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EliminarOpcionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
