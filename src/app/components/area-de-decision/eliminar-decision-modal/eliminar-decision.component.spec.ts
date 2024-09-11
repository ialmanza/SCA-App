import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EliminarDecisionComponent } from './eliminar-decision.component';

describe('EliminarDecisionComponent', () => {
  let component: EliminarDecisionComponent;
  let fixture: ComponentFixture<EliminarDecisionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EliminarDecisionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EliminarDecisionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
