import { Component, Injectable } from '@angular/core';
import { FormsModule } from '@angular/forms'; 
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
  private readonly triageSessionStorageKey = 'falai-patient-triage-session';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  login() {
    this.authService.login(this.cpf).subscribe({
      next: (res: AuthResponse) => {
        if (!res.authenticated) {
          this.errorMessage = 'CPF nao encontrado';  // Defina a mensagem de erro
          this.showErrorModal();  // Exiba o modal
          return;
        }

        if (!res.cpf) {
          this.errorMessage = 'Paciente nao encontrado. Entre em contato com a recepcao.';
          this.showErrorModal();
          return;
        }

        sessionStorage.setItem(this.triageSessionStorageKey, JSON.stringify({
          patientId: res.patientId,
          cpf: res.cpf,
          patientName: res.patientName,
        }));
        this.router.navigate(['/triagens']);
      },
      error: () => {
        this.errorMessage = 'Erro de conexao. Tente novamente mais tarde.';
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


