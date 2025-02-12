import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UltimopasoComponent } from './ultimopaso.component';

describe('UltimopasoComponent', () => {
  let component: UltimopasoComponent;
  let fixture: ComponentFixture<UltimopasoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UltimopasoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UltimopasoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
