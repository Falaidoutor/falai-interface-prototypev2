import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthApiResponse, AuthResponse } from '../../models/auth-response';
import { API_HOST } from '../../api.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private endpoint = '/api/login';

  constructor(private http: HttpClient) {}

  // Função para fazer o login
  login(cpf: string): Observable<AuthResponse> {
    const params = new HttpParams()
      .set('cpf', cpf.trim());

    return this.http
      .get<AuthApiResponse>(`${API_HOST}${this.endpoint}`, { params })
      .pipe(map((response) => this.normalizeAuthResponse(response)));
  }

  private normalizeAuthResponse(response: AuthApiResponse | null): AuthResponse {
    if (!response) {
      return {
        authenticated: false,
        patientName: null,
        patientId: null,
        cpf: null,
      };
    }

    const patient = response.patient ?? null;
    const patientId = this.toNumber(
      response.patientId ??
      response.patient_id ??
      response.id ??
      patient?.patientId ??
      patient?.patient_id ??
      patient?.id ??
      null,
    );
    const patientCpf = response.cpf ?? patient?.cpf ?? null;
    const patientName =
      response.patientName ??
      response.patient_name ??
      response.name ??
      patient?.patientName ??
      patient?.patient_name ??
      patient?.name ??
      null;

    return {
      authenticated: response.authenticated ?? (patientId !== null && !!patientCpf),
      patientName,
      patientId,
      cpf: patientCpf,
    };
  }

  private toNumber(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }
}
