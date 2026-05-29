import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PatientTriageSession } from '../../../models/patient-triage';
import { TriageService } from '../../../service/triageService/triage.service';

type ChatStep = 'queueTicket' | 'symptoms' | 'done';
type ChatMessage = {
  text: string;
  type: 'ia' | 'user' | 'contact';
};

@Component({
  selector: 'app-chat-triage',
  templateUrl: './chat-triage.component.html',
  styleUrl: './chat-triage.component.css',
  imports: [CommonModule, FormsModule]
})


export class ChatTriageComponent implements AfterViewInit {
  @ViewChild('userInput') userInput!: ElementRef<HTMLInputElement>;
  @ViewChild('chatMessages') chatMessages!: ElementRef<HTMLDivElement>;

  isChatBlocked = false;
  isLoading = false;

  firstName: string = '';
  patientName = '';
  createdQueueTicket = '';
  queueTicket = '';
  chatStep: ChatStep = 'queueTicket';
  private readonly triageSessionStorageKey = 'falai-patient-triage-session';
  private session: PatientTriageSession | null = null;

  constructor(
    private router: Router,
    private triageService: TriageService,
  ) {
    this.session = this.readSession();

    if (!this.session) {
      this.router.navigate(['/triage/login']);
      return;
    }

    this.patientName = this.session.patientName ?? '';
    this.firstName = this.patientName.split(' ')[0] || 'Paciente';
  }

  ngAfterViewInit(): void {
    console.log('Chat ready:', this.chatMessages);
  }

  messages: ChatMessage[] = [
    { text: 'Olá, {{ firstName }}! Informe a senha da fila para iniciar uma nova triagem.', type: 'ia' },
  ];
  
  
  userInputValue = '';

  get inputPlaceholder(): string {
    return this.chatStep === 'queueTicket'
      ? 'Digite a senha da fila...'
      : 'Digite sua mensagem...';
  }
  
  sendMessage(): void {
    if (this.isChatBlocked || !this.session) return;
    const text = this.userInputValue.trim();
    if (!text) return;
  
    this.messages.push({ text, type: 'user' });
    this.userInputValue = '';

    if (this.chatStep === 'queueTicket') {
      this.queueTicket = text;
      this.chatStep = 'symptoms';
      this.messages.push({
        text: 'Obrigado. O que está sentindo?',
        type: 'ia'
      });
      return;
    }

    this.isLoading = true;
  
    this.triageService.createPatientTriage(text, this.queueTicket, this.session).subscribe({
      next: (triage) => {
        this.isLoading = false;
        this.createdQueueTicket = triage.queueTicket || this.queueTicket;
        this.isChatBlocked = true;
        this.chatStep = 'done';
        this.messages.push({
          text: `Triagem registrada com sucesso.\n\nSenha da fila: ${this.createdQueueTicket}\n\nEla aparecera como pendente ate a analise da IA e a confirmacao do profissional de saude.`,
          type: 'ia'
        });
      },
      error: (err) => {
        console.error('Erro ao enviar sintomas:', err);
        this.isLoading = false;
        this.messages.push({
          text: 'Desculpe, nao foi possivel registrar a triagem. Tente novamente mais tarde.',
          type: 'ia'
        });
      }
    });
  }

  goToTriages(): void {
    this.router.navigate(['/triagens']);
  }

  private readSession(): PatientTriageSession | null {
    const rawSession = sessionStorage.getItem(this.triageSessionStorageKey);

    if (!rawSession) {
      return null;
    }

    try {
      const session = JSON.parse(rawSession) as PatientTriageSession;
      if (!session.cpf) {
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }
  
}



