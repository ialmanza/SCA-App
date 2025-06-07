import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidAlternativesComponent } from './valid-alternatives.component';

describe('ValidAlternativesComponent', () => {
  let component: ValidAlternativesComponent;
  let fixture: ComponentFixture<ValidAlternativesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValidAlternativesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ValidAlternativesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
