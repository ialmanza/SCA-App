import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModoDeComparacionComponent } from './modo-de-comparacion.component';

describe('ModoDeComparacionComponent', () => {
  let component: ModoDeComparacionComponent;
  let fixture: ComponentFixture<ModoDeComparacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModoDeComparacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModoDeComparacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
