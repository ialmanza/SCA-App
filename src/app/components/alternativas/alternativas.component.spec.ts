import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlternativasComponent } from './alternativas.component';

describe('AlternativasComponent', () => {
  let component: AlternativasComponent;
  let fixture: ComponentFixture<AlternativasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlternativasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlternativasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
