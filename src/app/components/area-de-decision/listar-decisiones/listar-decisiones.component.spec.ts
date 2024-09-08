import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListarDecisionesComponent } from './listar-decisiones.component';

describe('ListarDecisionesComponent', () => {
  let component: ListarDecisionesComponent;
  let fixture: ComponentFixture<ListarDecisionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListarDecisionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListarDecisionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
