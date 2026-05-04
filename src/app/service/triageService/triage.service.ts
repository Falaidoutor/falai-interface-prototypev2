import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TriageResponse } from '../../models/triage-response';
import { API_HOST } from '../../api.config';


@Injectable({
  providedIn: 'root'
})
export class TriageService {
  private endpoint = '/api/triage';

  constructor(private http: HttpClient) {}

  register(symptoms: string, queueTicket: string, queueId: number): Observable<TriageResponse> {
     return this.http.post<TriageResponse>(`${API_HOST}${this.endpoint}/chat`, { symptoms,
      queueTicket,
      queueId: String(queueId) });
  }
}
