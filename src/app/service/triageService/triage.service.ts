import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TriageResponse } from '../../models/triage-response';
import {
  PatientTriageListItem,
  PatientTriageSession,
} from '../../models/patient-triage';
import { API_HOST } from '../../api.config';


@Injectable({
  providedIn: 'root'
})
export class TriageService {
  private endpoint = '/api/triage';
  private patientTriagesEndpoint = '/api/triages';

  constructor(private http: HttpClient) {}

  listPatientTriages(session: PatientTriageSession): Observable<PatientTriageListItem[]> {
    const params = new HttpParams()
      .set('cpf', session.cpf);

    return this.http.get<PatientTriageListItem[]>(`${API_HOST}${this.patientTriagesEndpoint}/me`, { params });
  }

  createPatientTriage(symptoms: string, session: PatientTriageSession): Observable<PatientTriageListItem> {
    return this.http.post<PatientTriageListItem>(`${API_HOST}${this.patientTriagesEndpoint}`, {
      symptoms,
      cpf: session.cpf
    });
  }

  register(symptoms: string, queueTicket: string, queueId: number): Observable<TriageResponse> {
     return this.http.post<TriageResponse>(`${API_HOST}${this.endpoint}/chat`, { symptoms,
      queueTicket,
      queueId: String(queueId) });
  }
}
