import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatTriageComponent } from './chat-triage.component';

describe('ChatTriageComponent', () => {
  let component: ChatTriageComponent;
  let fixture: ComponentFixture<ChatTriageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatTriageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatTriageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
