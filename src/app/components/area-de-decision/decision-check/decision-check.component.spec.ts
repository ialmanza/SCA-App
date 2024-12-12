import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DecisionCheckComponent } from './decision-check.component';

describe('DecisionCheckComponent', () => {
  let component: DecisionCheckComponent;
  let fixture: ComponentFixture<DecisionCheckComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DecisionCheckComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DecisionCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
