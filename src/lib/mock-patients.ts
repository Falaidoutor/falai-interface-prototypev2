export type ManchesterLevel = "emergency" | "very-urgent" | "urgent" | "standard" | "non-urgent";

export const MANCHESTER_META: Record<
  ManchesterLevel,
  { label: string; waitMin: number; colorVar: string; description: string }
> = {
  emergency: {
    label: "Emergência",
    waitMin: 0,
    colorVar: "var(--manchester-red)",
    description: "Atendimento imediato",
  },
  "very-urgent": {
    label: "Muito Urgente",
    waitMin: 10,
    colorVar: "var(--manchester-orange)",
    description: "Até 10 minutos",
  },
  urgent: {
    label: "Urgente",
    waitMin: 60,
    colorVar: "var(--manchester-yellow)",
    description: "Até 60 minutos",
  },
  standard: {
    label: "Pouco Urgente",
    waitMin: 120,
    colorVar: "var(--manchester-green)",
    description: "Até 120 minutos",
  },
  "non-urgent": {
    label: "Não Urgente",
    waitMin: 240,
    colorVar: "var(--manchester-blue)",
    description: "Até 240 minutos",
  },
};

export type Patient = {
  id: string;
  ticket: string;
  patientName: string;
  cpf: string;
  age: number;
  arrivalTime: Date;
  symptoms: string;
  aiClassification: ManchesterLevel;
  aiJustification: string;
  extractedSymptoms: string[];
  esiCriteria: string[];
  status: "pending" | "validated";
};

const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000);

export const MOCK_PATIENTS: Patient[] = [
  {
    id: "p1",
    ticket: "A047",
    patientName: "Marcos Oliveira Lima",
    cpf: "412.889.301-22",
    age: 58,
    arrivalTime: minutesAgo(4),
    symptoms:
      "Dor torácica intensa em aperto irradiando para o braço esquerdo há cerca de 20 minutos, sudorese fria e falta de ar.",
    aiClassification: "emergency",
    aiJustification:
      "Quadro compatível com Síndrome Coronariana Aguda. Combinação de dor torácica típica, irradiação braquial e sintomas neurovegetativos exige avaliação imediata do especialista e ECG em até 10 minutos.",
    extractedSymptoms: [
      "Dor torácica em aperto",
      "Irradiação braço esquerdo",
      "Sudorese fria",
      "Dispneia",
    ],
    esiCriteria: [
      "ESI Nível 1 — Risco de vida iminente",
      "Manchester: Fluxograma Dor Torácica → Vermelho",
      "Indicador: Dor pré-cordial intensa + sinais autonômicos",
    ],
    status: "pending",
  },
  {
    id: "p2",
    ticket: "A048",
    patientName: "Helena Cardoso Ribeiro",
    cpf: "228.554.910-08",
    age: 34,
    arrivalTime: minutesAgo(12),
    symptoms:
      "Cefaleia súbita de forte intensidade iniciada há 1 hora, com fotofobia e um episódio de vômito. Refere ser a pior dor de cabeça da vida.",
    aiClassification: "very-urgent",
    aiJustification:
      "Cefaleia thunderclap com fotofobia e vômito sugere possível hemorragia subaracnóidea. Necessária neuroimagem e avaliação neurológica em até 10 minutos.",
    extractedSymptoms: ["Cefaleia súbita", "Pior dor da vida", "Fotofobia", "Vômito"],
    esiCriteria: [
      "ESI Nível 2 — Situação de alto risco",
      "Manchester: Cefaleia → Laranja (dor severa de início súbito)",
      "Sinal de alarme: thunderclap headache",
    ],
    status: "pending",
  },
  {
    id: "p3",
    ticket: "A049",
    patientName: "José Antônio da Silva",
    cpf: "157.012.443-19",
    age: 41,
    arrivalTime: minutesAgo(28),
    symptoms:
      "Febre de 38,9°C há 2 dias, tosse produtiva amarelada e dor torácica ventilatório-dependente à direita.",
    aiClassification: "urgent",
    aiJustification:
      "Síndrome respiratória febril com sinais de possível pneumonia comunitária. Saturação a confirmar; avaliação clínica e radiografia em até 60 minutos.",
    extractedSymptoms: ["Febre 38,9°C", "Tosse produtiva", "Dor pleurítica"],
    esiCriteria: [
      "ESI Nível 3 — Necessita múltiplos recursos",
      "Manchester: Dispneia em Adultos → Amarelo",
      "Suspeita: pneumonia comunitária",
    ],
    status: "pending",
  },
  {
    id: "p4",
    ticket: "A050",
    patientName: "Luiza Mendes Farias",
    cpf: "508.227.661-44",
    age: 27,
    arrivalTime: minutesAgo(46),
    symptoms:
      "Entorse de tornozelo direito após queda durante caminhada. Edema moderado, dor à palpação, consegue apoiar parcialmente.",
    aiClassification: "standard",
    aiJustification:
      "Trauma ortopédico de baixa energia sem sinais de fratura grave ou comprometimento neurovascular. Indicada radiografia conforme critérios de Ottawa.",
    extractedSymptoms: ["Entorse tornozelo", "Edema moderado", "Apoio parcial preservado"],
    esiCriteria: [
      "ESI Nível 4 — Um recurso necessário",
      "Manchester: Problemas em Membros → Verde",
      "Sem sinais de instabilidade hemodinâmica",
    ],
    status: "pending",
  },
  {
    id: "p5",
    ticket: "A051",
    patientName: "Ricardo Pereira Souza",
    cpf: "099.443.872-30",
    age: 22,
    arrivalTime: minutesAgo(72),
    symptoms:
      "Corte superficial no dedo indicador esquerdo durante preparo de alimento. Sangramento já cessado, sem perda de função.",
    aiClassification: "non-urgent",
    aiJustification:
      "Ferimento cortocontuso superficial sem comprometimento tendinoso ou neurovascular. Curativo simples e atualização vacinal se necessário.",
    extractedSymptoms: ["Corte superficial", "Hemostasia espontânea"],
    esiCriteria: [
      "ESI Nível 5 — Nenhum recurso necessário",
      "Manchester: Ferimentos → Azul",
      "Sem sinais de alarme",
    ],
    status: "pending",
  },
  {
    id: "p6",
    ticket: "A052",
    patientName: "Beatriz Almeida Costa",
    cpf: "344.781.205-67",
    age: 65,
    arrivalTime: minutesAgo(8),
    symptoms:
      "Dispneia progressiva há 3 horas, edema de membros inferiores, ortopneia. Histórico de insuficiência cardíaca.",
    aiClassification: "very-urgent",
    aiJustification:
      "Descompensação aguda de insuficiência cardíaca com sinais de congestão. Necessita oxigenoterapia e avaliação do especialista em até 10 minutos.",
    extractedSymptoms: ["Dispneia progressiva", "Edema MMII", "Ortopneia", "ICC prévia"],
    esiCriteria: [
      "ESI Nível 2 — Alto risco",
      "Manchester: Dispneia → Laranja",
      "Suspeita: edema agudo de pulmão",
    ],
    status: "pending",
  },
];
