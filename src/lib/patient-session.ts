import type { AuthResponse } from "@/lib/backend-api";
import { normalizeCpf, storeCpf } from "@/lib/patient-triages";

export type PatientTriageSession = {
  patientId: number | null;
  cpf: string;
  patientName: string | null;
};

const SESSION_KEY = "falai-patient-triage-session";

export function readPatientSession(): PatientTriageSession | null {
  if (typeof window === "undefined") return null;

  const raw = window.sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as PatientTriageSession;
    return session.cpf ? session : null;
  } catch {
    return null;
  }
}

export function storePatientSession(auth: AuthResponse, fallbackCpf: string) {
  if (typeof window === "undefined") return;

  const cpf = normalizeCpf(auth.cpf ?? fallbackCpf);
  if (!cpf) return;

  const session: PatientTriageSession = {
    patientId: auth.patientId,
    cpf,
    patientName: auth.patientName,
  };

  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  storeCpf(cpf);
}

export function clearPatientSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SESSION_KEY);
}
