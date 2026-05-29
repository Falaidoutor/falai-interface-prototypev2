export interface AuthResponse {
  authenticated: boolean;
  patientName: string | null;
  patientId: number | null;
  cpf: string | null;
}
