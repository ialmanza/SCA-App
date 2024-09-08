import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearDecisionComponent } from './crear-decision.component';

describe('CrearDecisionComponent', () => {
  let component: CrearDecisionComponent;
  let fixture: ComponentFixture<CrearDecisionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearDecisionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearDecisionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
