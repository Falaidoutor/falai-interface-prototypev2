import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MockAuthService } from '../../service/authService/mock-auth.service';

@Component({
  selector: 'app-app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './app-login.component.html',
  styleUrl: './app-login.component.css'
})
export class AppLoginComponent {
  username = '';
  password = '';
  errorMessage = '';

  constructor(
    private authService: MockAuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  login(): void {
    if (!this.authService.login(this.username, this.password)) {
      this.errorMessage = 'Usuário ou senha inválidos. Verifique os dados e tente novamente.';
      return;
    }

    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/home';
    this.router.navigateByUrl(returnUrl);
  }
}
