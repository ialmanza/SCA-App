import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DecisionesFormComponent } from './decisiones-form.component';

describe('DecisionesFormComponent', () => {
  let component: DecisionesFormComponent;
  let fixture: ComponentFixture<DecisionesFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DecisionesFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DecisionesFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
