import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TriageCasesLayoutComponent } from './triage-cases-layout.component';

describe('TriageCasesLayoutComponent', () => {
  let component: TriageCasesLayoutComponent;
  let fixture: ComponentFixture<TriageCasesLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TriageCasesLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TriageCasesLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
