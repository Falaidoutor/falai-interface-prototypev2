export interface PatientResult {
    queueId: number;
    triageId?: number;
    source?: 'queue-triage' | 'patient-triage';
    name: string;
    age: number; 
    gender: string; 
    classificacao: string;
    prioridade: string;
    queueTicket: string;
    status?: string;
}
