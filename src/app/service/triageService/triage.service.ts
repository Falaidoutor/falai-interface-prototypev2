import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TriageResponse } from '../../models/triage-response';


@Injectable({
  providedIn: 'root'
})
export class TriageService {
  private apiUrl = 'http://localhost:8080/api/triage';

  constructor(private http: HttpClient) {}

  register(symptoms: string, queueTicket: string, queueId: number): Observable<TriageResponse> {
     return this.http.post<TriageResponse>(`${this.apiUrl}/chat`, { symptoms,
      queueTicket,
      queueId });
  }
}
