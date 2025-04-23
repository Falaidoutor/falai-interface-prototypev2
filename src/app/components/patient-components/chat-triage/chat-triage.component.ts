import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  queueTriageId!: number;
  patientName!: string;
  queueTicket!: string;
  status!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private triageService: TriageService,
  ) {
    this.queueTriageId = Number(this.route.snapshot.paramMap.get('id'));
    const navState = this.router.getCurrentNavigation()?.extras.state;
    this.patientName = navState?.['patientName'];
    this.status = navState?.['status'];
    this.queueTicket = navState?.['queueTicket']
    this.firstName = this.patientName.split(' ')[0];
    this.isChatBlocked = this.status === 1 || this.status === 2;
  }

  ngAfterViewInit(): void {
    console.log('Chat ready:', this.chatMessages);
  }

  messages = [
    { text: 'Olá, {{ firstName }}! O que está sentindo?', type: 'ia' },
    
  ];
  
  
  userInputValue = '';
  
  sendMessage(): void {
    if (this.isChatBlocked) return; // impede envio de mensagem se bloqueado
    const text = this.userInputValue.trim();
    if (!text) return;
  
    this.messages.push({ text, type: 'user' });
    this.userInputValue = '';
  
    
  if (this.status === 1) {
    this.messages.push({
      text: 'Sua triagem já foi finalizada!',
      type: 'ia'
    });
    return;
  } else if (this.status === 2) {
    this.messages.push({
      text: 'Sua triagem foi cancelada.',
      type: 'ia'
    });
    return;
  }

  this.isLoading = true; // ativa o spinner
  
    this.triageService.register(text, this.queueTicket, this.queueTriageId).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.messages.push({
          text: `${response.risk}\n\n${response.justification}`,
          type: 'ia'
        });
        this.status = 1;
      },
      error: (err) => {
        console.error('Erro ao enviar sintomas:', err);
        this.isLoading = false;
        this.messages.push({
          text: 'Desculpe, ocorreu um erro. Tente novamente mais tarde.',
          type: 'ia'
        });
      }
    });
  }
  
}
