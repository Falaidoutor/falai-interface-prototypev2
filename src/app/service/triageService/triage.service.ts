import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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

    return this.http
      .get<PatientTriageListItem[] | { data?: PatientTriageListItem[] | null; triages?: PatientTriageListItem[] | null }>(
        `${API_HOST}${this.patientTriagesEndpoint}/me`,
        { params },
      )
      .pipe(
        map((response) => this.normalizeTriageList(response)),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 404) {
            return of([]);
          }

          return throwError(() => error);
        }),
      );
  }

  createPatientTriage(
    symptoms: string,
    session: PatientTriageSession,
  ): Observable<PatientTriageListItem> {
    const body: {
      symptoms: string;
      cpf: string;
      patientId?: number;
    } = {
      symptoms,
      cpf: session.cpf
    };

    if (session.patientId !== null) {
      body.patientId = session.patientId;
    }

    return this.http.post<PatientTriageListItem>(`${API_HOST}${this.patientTriagesEndpoint}`, body);
  }

  register(symptoms: string, queueTicket: string, queueId: number): Observable<TriageResponse> {
     return this.http.post<TriageResponse>(`${API_HOST}${this.endpoint}/chat`, { symptoms,
      queueTicket,
      queueId: String(queueId) });
  }

  private normalizeTriageList(
    response: PatientTriageListItem[] | { data?: PatientTriageListItem[] | null; triages?: PatientTriageListItem[] | null } | null,
  ): PatientTriageListItem[] {
    if (Array.isArray(response)) {
      return response;
    }

    return response?.data ?? response?.triages ?? [];
  }
}
