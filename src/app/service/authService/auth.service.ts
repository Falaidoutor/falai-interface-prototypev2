import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:8080/api/triage/login';

  constructor(private http: HttpClient) {}

  // Função para fazer o login
  login(cpf: string, queueTicket: string): Observable<any> {
    const params = new HttpParams()
      .set('cpf', cpf)
      .set('queueTicket', queueTicket);

    return this.http.get<any>(this.apiUrl, { params });
  }
}