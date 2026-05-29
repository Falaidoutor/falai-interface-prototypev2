export interface PatientTriageListItem {
  id: number;
  symptoms: string;
  queueTicket: string;
  symptomsPreview: string;
  createdAt: string;
  updatedAt: string;
  status: 'PENDING' | 'AI_PROCESSING' | 'WAITING_PROFESSIONAL_REVIEW' | 'COMPLETED';
  patientStatus: 'PENDENTE' | 'ANALISADA';
  riskClassification: string | null;
  displayColor: string;
}

export interface PatientTriageSession {
  patientId: number;
  cpf: string;
  patientName: string | null;
}
