import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-chat-triage',
  templateUrl: './chat-triage.component.html',
  styleUrl: './chat-triage.component.css',
  imports: [CommonModule, FormsModule]
})


export class ChatTriageComponent implements AfterViewInit {
  @ViewChild('userInput') userInput!: ElementRef<HTMLInputElement>;
  @ViewChild('chatMessages') chatMessages!: ElementRef<HTMLDivElement>;
  firstName: string = '';
  
  queueTriageId!: number;
  patientName!: string;
  status!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {
    
    this.queueTriageId = Number(this.route.snapshot.paramMap.get('id'));
    const navState = this.router.getCurrentNavigation()?.extras.state;
    this.patientName = navState?.['patientName'] ?? '';
    this.status      = navState?.['status']      ?? 5;
    this.firstName = this.patientName.split(' ')[0];
  }

  ngAfterViewInit(): void {
    console.log('Chat ready:', this.chatMessages);
  }

  messages = [
    { text: 'Olá, {{ firstName }}! O que está sentindo?', type: 'ia' },
    
  ];
  
  userInputValue = '';
  
  sendMessage(): void {
    const text = this.userInputValue.trim();
    if (text) {
      this.messages.push({ text, type: 'user' });
      this.userInputValue = '';
  
      setTimeout(() => {
        this.messages.push({
          text: 'Entendido! Em breve, retorno com orientações.',
          type: 'ia'
        });
      }, 1000);
    }
  }
  
}
