import { Patient } from '../../models/patient';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_HOST } from '../../api.config';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private endpoint = '/api/';

  constructor(private http: HttpClient) { }

  createPatient(paciente: Patient): Observable<Patient> {
    return this.http.post<Patient>(`${API_HOST}${this.endpoint}patients`, paciente);
  }

  createPatientAndQueue(paciente: Patient): Observable<Patient> {
    return this.http.post<Patient>(`${API_HOST}${this.endpoint}patients`, paciente);
  }
}
