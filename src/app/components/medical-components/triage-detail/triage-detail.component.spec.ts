import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TriageDetailComponent } from './triage-detail.component';

describe('TriageDetailComponent', () => {
  let component: TriageDetailComponent;
  let fixture: ComponentFixture<TriageDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TriageDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TriageDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
