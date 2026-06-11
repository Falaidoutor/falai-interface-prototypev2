import type { PatientTriageStatus } from "@/lib/backend-api";

export function normalizeCpf(cpf: string) {
  return cpf.replace(/\D/g, "");
}

export function formatCpf(cpf: string) {
  const digits = normalizeCpf(cpf).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function readStoredCpf() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("falai.currentCpf") ?? "";
}

export function storeCpf(cpf: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("falai.currentCpf", normalizeCpf(cpf));
}

export function getStatusLabel(status: PatientTriageStatus) {
  const labels: Record<PatientTriageStatus, string> = {
    PENDING: "Recebida",
    AI_PROCESSING: "IA processando",
    WAITING_PROFESSIONAL_REVIEW: "Aguardando revisão",
    COMPLETED: "Analisada",
  };
  return labels[status];
}
