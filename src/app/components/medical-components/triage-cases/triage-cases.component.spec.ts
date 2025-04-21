import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TriageCasesComponent } from './triage-cases.component';

describe('TriageCasesComponent', () => {
  let component: TriageCasesComponent;
  let fixture: ComponentFixture<TriageCasesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TriageCasesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TriageCasesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
