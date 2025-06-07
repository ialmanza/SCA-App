import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvalidAlternativesComponent } from './invalid-alternatives.component';

describe('InvalidAlternativesComponent', () => {
  let component: InvalidAlternativesComponent;
  let fixture: ComponentFixture<InvalidAlternativesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvalidAlternativesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvalidAlternativesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
