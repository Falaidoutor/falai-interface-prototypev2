import { Patient } from '../../models/patient';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_HOST } from '../../api.config';

export type PatientPayload = Pick<Patient, 'name' | 'age' | 'gender' | 'cpf'>;

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private endpoint = `${API_HOST}/api/patients`;

  constructor(private http: HttpClient) { }

  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(this.endpoint);
  }

  getPatientById(id: number): Observable<Patient> {
    return this.http.get<Patient>(`${this.endpoint}/${id}`);
  }

  createPatient(paciente: PatientPayload): Observable<Patient> {
    return this.http.post<Patient>(this.endpoint, paciente);
  }

  updatePatient(id: number, paciente: Partial<PatientPayload>): Observable<Patient> {
    return this.http.put<Patient>(`${this.endpoint}/${id}`, paciente);
  }

  deletePatient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }

  createPatientAndQueue(paciente: PatientPayload): Observable<Patient> {
    return this.createPatient(paciente);
  }
}

