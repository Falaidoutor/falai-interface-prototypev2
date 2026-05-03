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
  private novaAnaliseEndpoint = '/api/triagens';


  constructor(private http: HttpClient) { }

  getCases(): Observable<PatientResult[]> {
    return this.http.get<PatientResult[]>(`${API_HOST}${this.endpoint}`);
  }

  getTriageDetail(id:string): Observable<TriageDetail> {
    return this.http.get<TriageDetail>(`${API_HOST}${this.endpoint}/${id}`);
  }

  enviarNovaTriagem(id: string, triagem: { analise: string, status: string }) {
  return this.http.post(`${API_HOST}${this.novaAnaliseEndpoint}/${id}/nova-analise`, triagem);
}
}
