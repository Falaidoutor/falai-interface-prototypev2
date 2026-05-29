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
    const normalizedCpf = cpf.trim();
    const params = new HttpParams()
      .set('cpf', normalizedCpf);

    return this.http
      .get<AuthApiResponse>(`${API_HOST}${this.endpoint}`, { params })
      .pipe(map((response) => this.normalizeAuthResponse(response, normalizedCpf)));
  }

  private normalizeAuthResponse(response: AuthApiResponse | null, requestedCpf: string): AuthResponse {
    if (!response) {
      return {
        authenticated: false,
        patientName: null,
        patientId: null,
        cpf: null,
      };
    }

    const payload = response.data ?? response.result ?? response;
    const patient = payload.patient ?? payload.paciente ?? payload.user ?? null;
    const patientId = this.toNumber(
      payload.patientId ??
      payload.patient_id ??
      payload.id ??
      patient?.patientId ??
      patient?.patient_id ??
      patient?.id ??
      null,
    );
    const patientCpf = payload.cpf ?? patient?.cpf ?? requestedCpf;
    const patientName =
      payload.patientName ??
      payload.patient_name ??
      payload.name ??
      patient?.patientName ??
      patient?.patient_name ??
      patient?.nome ??
      patient?.name ??
      null;

    return {
      authenticated: payload.authenticated ?? response.authenticated ?? !!patientCpf,
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
