import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablaDecisionesComponent } from './tabla-decisiones.component';

describe('TablaDecisionesComponent', () => {
  let component: TablaDecisionesComponent;
  let fixture: ComponentFixture<TablaDecisionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaDecisionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TablaDecisionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
