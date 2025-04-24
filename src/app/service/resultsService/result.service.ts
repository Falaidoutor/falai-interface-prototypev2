import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PatientResult } from '../../models/patient-result';
import { TriageDetail } from '../../models/triage-detail';

@Injectable({
  providedIn: 'root'
})
export class ResultService {
  private apiUrl = 'http://localhost:8080/api/triage';


  constructor(private http: HttpClient) { }

  getCases(): Observable<PatientResult[]> {
    return this.http.get<PatientResult[]>(`${this.apiUrl}/getTriages`);
  }

  getTriageDetail(id:number): Observable<TriageDetail[]> {
    return this.http.get<TriageDetail[]>(`${this.apiUrl}/getDetails/${id}`);
  }
}
