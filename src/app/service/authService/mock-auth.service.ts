import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MockAuthService {
  private readonly storageKey = 'falai-authenticated';
  private readonly validUsername = 'admin';
  private readonly validPassword = 'pex5';

  login(username: string, password: string): boolean {
    const isValid = username.trim() === this.validUsername && password === this.validPassword;

    if (isValid) {
      sessionStorage.setItem(this.storageKey, 'true');
    }

    return isValid;
  }

  logout(): void {
    sessionStorage.removeItem(this.storageKey);
  }

  isAuthenticated(): boolean {
    return sessionStorage.getItem(this.storageKey) === 'true';
  }
}
