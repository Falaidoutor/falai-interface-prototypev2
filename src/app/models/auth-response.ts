export interface AuthResponse {
    authenticated: boolean;
    patientName: string | null;
    queueTriageId: number | null;
    status: number | null;   
  }