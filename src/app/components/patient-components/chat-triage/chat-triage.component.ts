import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PatientTriageSession } from '../../../models/patient-triage';
import { TriageService } from '../../../service/triageService/triage.service';

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

  messages = [
    { text: 'Olá, {{ firstName }}! O que está sentindo?', type: 'ia' },
  ];
  
  
  userInputValue = '';
  
  sendMessage(): void {
    if (this.isChatBlocked || !this.session) return;
    const text = this.userInputValue.trim();
    if (!text) return;
  
    this.messages.push({ text, type: 'user' });
    this.userInputValue = '';

    this.isLoading = true;
  
    this.triageService.createPatientTriage(text, this.session).subscribe({
      next: (triage) => {
        this.isLoading = false;
        this.createdQueueTicket = triage.queueTicket;
        this.isChatBlocked = true;
        this.messages.push({
          text: `Triagem registrada com sucesso.\n\nSenha da fila: ${triage.queueTicket}\n\nEla aparecera como pendente ate a analise da IA e a confirmacao do profissional de saude.`,
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
      if (!session.patientId || !session.cpf) {
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }
  
}



