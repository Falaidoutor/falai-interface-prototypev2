import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { FormTriageComponent } from './form-triage.component';

describe('FormTriageComponent', () => {
  let component: FormTriageComponent;
  let fixture: ComponentFixture<FormTriageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FormTriageComponent],
      imports: [FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(FormTriageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve ter 12 sintomas', () => {
    expect(component.sintomas.length).toBe(12);
  });

  it('deve atualizar valor do slider', () => {
    component.atualizarValor(0, 3);
    expect(component.valores[0]).toBe(3);
  });
});
