import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckMostrarDecisionesComponent } from './check-mostrar-decisiones.component';

describe('CheckMostrarDecisionesComponent', () => {
  let component: CheckMostrarDecisionesComponent;
  let fixture: ComponentFixture<CheckMostrarDecisionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckMostrarDecisionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckMostrarDecisionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
