import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; 
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

declare var bootstrap: any;

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})

export class LoginComponent {
  cpf: string = '';
  senhaFila: string = '';

  // CPF e senha mockados
  private cpfMock = '12345678900';
  private senhaMock = 'senha123';

  constructor(private router: Router) {}

  login() {
    console.log("Teste");
    if (this.cpf === this.cpfMock && this.senhaFila === this.senhaMock) {
      this.router.navigate(['/triage/chat']);
    } else {
      const modal = new bootstrap.Modal(document.getElementById('loginErrorModal')!);
      modal.show();
    }
  }
}

  /*login() {
    const body = { cpf: this.cpf, senhaFila: this.senhaFila };

    this.http.post<any>('/login', body).subscribe({
      next: () => this.router.navigate(['/chat-triage']),
      error: () => {
        const modal = new bootstrap.Modal(document.getElementById('loginErrorModal'));
        modal.show();
      }
    });
  }*/
