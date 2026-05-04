import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthResponse } from '../../models/auth-response';
import { API_HOST } from '../../api.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private endpoint = '/api/login';

  constructor(private http: HttpClient) {}

  // Função para fazer o login
  login(cpf: string, queueTicket: string): Observable<AuthResponse> {
    const params = new HttpParams()
      .set('cpf', cpf)
      .set('queueTicket', queueTicket);

    return this.http.get<AuthResponse>(`${API_HOST}${this.endpoint}`, { params });
  }
}


