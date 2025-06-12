import { Patient } from '../../models/patient';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = 'http://localhost:8080/api/';

  constructor(private http: HttpClient) { }

  createPatient(paciente: Patient): Observable<Patient> {
    return this.http.post<Patient>(this.apiUrl+'patients', paciente);
  }

  createPatientAndQueue(paciente: Patient): Observable<Patient> {
    return this.http.post<Patient>(this.apiUrl+'patients', paciente);
  }
}
