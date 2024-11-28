import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablaDeComparacionComponent } from './tabla-de-comparacion.component';

describe('TablaDeComparacionComponent', () => {
  let component: TablaDeComparacionComponent;
  let fixture: ComponentFixture<TablaDeComparacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaDeComparacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TablaDeComparacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
