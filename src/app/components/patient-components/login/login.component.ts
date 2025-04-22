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
  cpf = '';
  senhaFila = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  login() {
    this.authService.login(this.cpf, this.senhaFila).subscribe({
      next: (res: AuthResponse) => {
        if (res.authenticated) {
          this.router.navigate(
            ['/triage/chat', res.queueTriageId],
            {
              state: {
                patientName: res.patientName,
                status: res.status
              }
            }
          );
        } else {
          this.showErrorModal();
        }
      },
      error: () => {
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