import { Component, Injectable } from '@angular/core';
import { FormsModule } from '@angular/forms'; 
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../service/authService/auth.service';
import { AuthResponse } from '../../../models/auth-response';

declare var bootstrap: any;

@Injectable({
  providedIn: 'root'
})

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})

export class LoginComponent {
  errorMessage: string = ''; 
  cpf = '';
  senhaFila = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  login() {
    this.authService.login(this.cpf, this.senhaFila).subscribe({
      next: (res: AuthResponse) => {
        if (!res.authenticated) {
          this.errorMessage = 'CPF ou senha inválidos';  // Defina a mensagem de erro
          this.showErrorModal();  // Exiba o modal
          return;
        }

        switch (res.statusId) {
          case 0: // Em aberto
            this.router.navigate(
              ['/triage/chat', res.queueTriageId],
              {
                state: {
                  queueTicket: this.senhaFila,
                  patientName: res.patientName,
                  status: res.statusId
                }
              }
            );
            break;

          case 1: // Finalizada
            this.errorMessage = 'Sua triagem já foi finalizada.';
            this.showErrorModal();
            break;

          case 2: // Cancelada
            this.errorMessage = 'Sua triagem foi cancelada.';
            this.showErrorModal();
            break;

          default:
            this.errorMessage = 'Status desconhecido. Entre em contato com a recepção.';
            this.showErrorModal();
        }
      },
      error: () => {
        this.errorMessage = 'Erro de conexão. Tente novamente mais tarde.';
        this.showErrorModal();
      }
    });
  }

  private showErrorModal() {
    const modal = new bootstrap.Modal(
      document.getElementById('loginErrorModal')!
    );
    modal.show();
  }
}