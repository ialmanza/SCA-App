import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PosiblesAlternativasComponent } from './posibles-alternativas.component';

describe('PosiblesAlternativasComponent', () => {
  let component: PosiblesAlternativasComponent;
  let fixture: ComponentFixture<PosiblesAlternativasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PosiblesAlternativasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PosiblesAlternativasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
