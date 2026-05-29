export interface AuthResponse {
  authenticated: boolean;
  patientName: string | null;
  patientId: number | null;
  cpf: string | null;
}

export interface AuthApiResponse {
  authenticated?: boolean;
  patientName?: string | null;
  patient_name?: string | null;
  patientId?: number | string | null;
  patient_id?: number | string | null;
  id?: number | string | null;
  cpf?: string | null;
  name?: string | null;
  patient?: {
    id?: number | string | null;
    patientId?: number | string | null;
    patient_id?: number | string | null;
    cpf?: string | null;
    name?: string | null;
    patientName?: string | null;
    patient_name?: string | null;
  } | null;
}
