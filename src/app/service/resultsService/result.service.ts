import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PatientResult } from '../../models/patient-result';
import { TriageDetail } from '../../models/triage-detail';
import { API_HOST } from '../../api.config';

@Injectable({
  providedIn: 'root'
})
export class ResultService {
  private endpoint = '/api/triages';


  constructor(private http: HttpClient) { }

  getCases(): Observable<PatientResult[]> {
    return this.http.get<PatientResult[]>(`${API_HOST}${this.endpoint}`);
  }

  getTriageDetail(id:string): Observable<TriageDetail> {
    return this.http.get<TriageDetail>(`${API_HOST}${this.endpoint}/${id}`);
  }

  getPatientTriageDetail(id: string): Observable<TriageDetail> {
    return this.http.get<TriageDetail>(`${API_HOST}${this.endpoint}/patient/${id}`);
  }

  enviarNovaTriagem(id: string, triagem: { analise: string, status: string }): Observable<TriageDetail> {
    return this.http.put<TriageDetail>(`${API_HOST}${this.endpoint}/${id}`, {
      classificacao: triagem.status,
      justificativa: triagem.analise,
    });
  }

  revisarPatientTriage(id: string, triagem: { analise: string, status: string }): Observable<TriageDetail> {
    return this.http.patch<TriageDetail>(`${API_HOST}${this.endpoint}/${id}/professional-review`, {
      finalRiskClassification: triagem.status,
      professionalNotes: triagem.analise,
    });
  }

  deleteTriage(queueId: string): Observable<void> {
    return this.http.delete<void>(`${API_HOST}${this.endpoint}/${queueId}`);
  }
}
