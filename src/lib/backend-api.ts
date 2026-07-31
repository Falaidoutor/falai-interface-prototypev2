import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { restorePortugueseAccents } from "@/lib/portuguese-text";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonRecord = { [key: string]: JsonValue };

export type AuthResponse = {
  authenticated: boolean;
  patientName: string | null;
  patientId: number | null;
  cpf: string | null;
};

export type PatientTriageStatus =
  | "PENDING"
  | "AI_PROCESSING"
  | "WAITING_PROFESSIONAL_REVIEW"
  | "COMPLETED";

export type PatientTriage = {
  id: number;
  symptoms: string;
  queueTicket: string;
  symptomsPreview: string;
  createdAt: string;
  updatedAt: string;
  status: PatientTriageStatus;
  patientStatus: "PENDENTE" | "ANALISADA";
  riskClassification: string | null;
  displayColor: string;
};

export type EsiLevel = "ESI-1" | "ESI-2" | "ESI-3" | "ESI-4" | "ESI-5";

export type PendingReviewTriage = {
  id: number;
  patientId: number;
  patientName: string;
  patientAge: number;
  patientGender: string;
  symptoms: string;
  aiSummary: string | null;
  aiSuggestedRiskClassification: string | null;
  aiSuggestedRiskColor: string | null;
  aiRecommendedAction: string | null;
  aiResult: JsonRecord | null;
  createdAt: string;
  aiProcessedAt: string | null;
  queueTriageId: number | null;
  queueTicket: string | null;
};

export type ProfessionalReviewInput = {
  triageId: number;
  professionalId?: string;
  professionalNotes?: string;
  finalResult?: JsonRecord;
  finalRiskClassification: EsiLevel;
  finalRiskColor?: string;
};

export type MedicalQueueCase = {
  queueId: number;
  triageId?: number;
  source?: "queue-triage" | "patient-triage";
  name: string;
  gender: string;
  age: number;
  queueTicket: string;
  classificacao: string;
  prioridade: string;
  status?: PatientTriageStatus | string;
};

export type FinalizedTriageDetails = {
  queueId: number;
  triageId?: number;
  source?: "queue-triage" | "patient-triage";
  name: string;
  gender: string;
  age: number;
  queueTicket: string;
  symptoms: string;
  classificacao: string;
  nivel: number;
  nome_nivel: string;
  ponto_decisao_ativado: string;
  criterios_ponto_decisao: string[];
  justificativa: string;
  createdAtDate: string;
  createdAtTime: string;
  aiRecommendedAction?: string | null;
  aiSummary?: string | null;
  aiResult?: JsonRecord | null;
  professionalNotes?: string | null;
  finalResult?: JsonRecord | null;
  finalRiskClassification?: string | null;
};

export type AnalyticsMetrics = {
  generatedAt: string;
  patientsToday: number;
  patientsTodayDelta: number | null;
  averageWaitMinutes: number | null;
  averageWaitDelta: number | null;
  aiAccuracy: number | null;
  aiAccuracyDelta: number | null;
  criticalCases: number;
  criticalCasesDelta: number | null;
  riskDistribution: Array<{ level: EsiLevel; count: number }>;
  hourlyVolume: number[];
  forecastDemand: number[];
  staffingCapacity: number[];
  agreement: { total: number | null; oneLevel: number | null; broad: number | null };
  qualityPeriod: "today" | "yesterday" | "last7d" | "last30d";
  qualityPeriodLabel: string;
  qualityStart: string;
  qualityEnd: string;
};

export type ModelConfig = {
  id: string;
  modelName: string;
  provider: string;
  systemPrompt: string;
  temperature: number;
  topP: number;
  ragEnabled: boolean;
  streamingEnabled: boolean;
  versionLabel: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

const cpfSchema = z.object({ cpf: z.string().min(1) });
const patientTriageStatusSchema = z.enum([
  "PENDING",
  "AI_PROCESSING",
  "WAITING_PROFESSIONAL_REVIEW",
  "COMPLETED",
]);
const esiLevelSchema = z.enum(["ESI-1", "ESI-2", "ESI-3", "ESI-4", "ESI-5"]);

const createTriageSchema = z.object({
  cpf: z.string().min(1),
  patientId: z.number().nullable().optional(),
  symptoms: z.string().min(1),
});

const professionalReviewSchema = z.object({
  triageId: z.number(),
  professionalId: z.string().optional(),
  professionalNotes: z.string().optional(),
  finalResult: z.record(z.any()).optional(),
  finalRiskClassification: esiLevelSchema,
  finalRiskColor: z.string().optional(),
});

const triageDetailsSchema = z.object({
  id: z.number(),
  source: z.enum(["patient-triage", "queue-triage"]),
});

const authResponseSchema = z.object({
  authenticated: z.boolean(),
  patientName: z.string().nullable(),
  patientId: z.number().nullable(),
  cpf: z.string().nullable(),
});

const patientTriageResponseSchema = z.object({
  id: z.number(),
  symptoms: z.string(),
  queueTicket: z.string(),
  symptomsPreview: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  status: patientTriageStatusSchema,
  patientStatus: z.enum(["PENDENTE", "ANALISADA"]),
  riskClassification: z.string().nullable(),
  displayColor: z.string(),
});

const patientTriageListResponseSchema = z.union([
  z.array(patientTriageResponseSchema),
  z.object({
    data: z.array(patientTriageResponseSchema).nullable().optional(),
    triages: z.array(patientTriageResponseSchema).nullable().optional(),
  }),
]);

const pendingReviewTriageSchema = z.object({
  id: z.number(),
  patientId: z.number(),
  patientName: z.string(),
  patientAge: z.number(),
  patientGender: z.string(),
  symptoms: z.string(),
  aiSummary: z.string().nullable(),
  aiSuggestedRiskClassification: z.string().nullable(),
  aiSuggestedRiskColor: z.string().nullable(),
  aiRecommendedAction: z.string().nullable(),
  aiResult: z.record(z.any()).nullable(),
  createdAt: z.string(),
  aiProcessedAt: z.string().nullable(),
  queueTriageId: z.number().nullable(),
  queueTicket: z.string().nullable(),
});

const medicalQueueCaseSchema = z.object({
  queueId: z.number(),
  triageId: z.number().optional(),
  source: z.enum(["queue-triage", "patient-triage"]).optional(),
  name: z.string(),
  gender: z.string(),
  age: z.number(),
  queueTicket: z.string(),
  classificacao: z.string(),
  prioridade: z.string(),
  status: z.union([patientTriageStatusSchema, z.string()]).optional(),
});

const finalizedTriageDetailsSchema = z.object({
  queueId: z.number(),
  triageId: z.number().optional(),
  source: z.enum(["queue-triage", "patient-triage"]).optional(),
  name: z.string(),
  gender: z.string(),
  age: z.number(),
  queueTicket: z.string(),
  symptoms: z.string(),
  classificacao: z.string(),
  nivel: z.number(),
  nome_nivel: z.string(),
  ponto_decisao_ativado: z.string(),
  criterios_ponto_decisao: z.array(z.string()),
  justificativa: z.string(),
  createdAtDate: z.string(),
  createdAtTime: z.string(),
  aiRecommendedAction: z.string().nullable().optional(),
  aiSummary: z.string().nullable().optional(),
  aiResult: z.record(z.any()).nullable().optional(),
  professionalNotes: z.string().nullable().optional(),
  finalResult: z.record(z.any()).nullable().optional(),
  finalRiskClassification: z.string().nullable().optional(),
});

const analyticsMetricsSchema: z.ZodType<AnalyticsMetrics> = z.object({
  generatedAt: z.string(),
  patientsToday: z.number(),
  patientsTodayDelta: z.number().nullable(),
  averageWaitMinutes: z.number().nullable(),
  averageWaitDelta: z.number().nullable(),
  aiAccuracy: z.number().nullable(),
  aiAccuracyDelta: z.number().nullable(),
  criticalCases: z.number(),
  criticalCasesDelta: z.number().nullable(),
  riskDistribution: z.array(z.object({ level: esiLevelSchema, count: z.number() })),
  hourlyVolume: z.array(z.number()),
  forecastDemand: z.array(z.number()),
  staffingCapacity: z.array(z.number()),
  agreement: z.object({
    total: z.number().nullable(),
    oneLevel: z.number().nullable(),
    broad: z.number().nullable(),
  }),
  qualityPeriod: z.enum(["today", "yesterday", "last7d", "last30d"]),
  qualityPeriodLabel: z.string(),
  qualityStart: z.string(),
  qualityEnd: z.string(),
});

const analyticsMetricsInputSchema = z.object({
  qualityPeriod: z.enum(["today", "yesterday", "last7d", "last30d"]),
});

const modelConfigSchema = z.object({
  id: z.string(),
  modelName: z.string(),
  provider: z.string(),
  systemPrompt: z.string(),
  temperature: z.number(),
  topP: z.number(),
  ragEnabled: z.boolean(),
  streamingEnabled: z.boolean(),
  versionLabel: z.string().nullable(),
  createdBy: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const updateModelConfigSchema = modelConfigSchema.pick({
  modelName: true,
  provider: true,
  systemPrompt: true,
  temperature: true,
  topP: true,
  ragEnabled: true,
  streamingEnabled: true,
}).extend({
  versionLabel: z.string().optional(),
  createdBy: z.string().optional(),
});

const backendDatabaseErrorPattern = /tenant\/user postgres\.[\w-]+ not found/i;
const backendModelConfigSchemaErrorPattern = /Data type "Object" in "ModelParameterVersion\.(versionLabel|createdBy)" is not supported/i;
const backendModelConfigTableErrorPattern = /relation .*model_parameter_versions.* does not exist/i;

export const authenticatePatient = createServerFn({ method: "GET" })
  .inputValidator(cpfSchema)
  .handler(async ({ data }) => {
    return fetchBackend(`/login?cpf=${encodeURIComponent(data.cpf)}`, {}, authResponseSchema);
  });

export const listPatientTriagesFromBackend = createServerFn({ method: "GET" })
  .inputValidator(cpfSchema)
  .handler(async ({ data }) => {
    const response = await fetchBackend(
      `/triages/me?cpf=${encodeURIComponent(data.cpf)}`,
      {},
      patientTriageListResponseSchema,
    );
    return normalizeList(response);
  });

export const createPatientTriageOnBackend = createServerFn({ method: "POST" })
  .inputValidator(createTriageSchema)
  .handler(async ({ data }) => {
    return fetchBackend(
      "/triages",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      patientTriageResponseSchema,
    );
  });

export const listPendingReviewTriages = createServerFn({ method: "GET" }).handler(async () => {
  const triages = await fetchBackend(
    "/triages/pending-review",
    {},
    z.array(pendingReviewTriageSchema),
  );
  return triages.map(normalizePendingReviewTriage);
});

export const listMedicalQueueCases = createServerFn({ method: "GET" }).handler(async () => {
  return fetchBackend("/triages", {}, z.array(medicalQueueCaseSchema));
});

export const submitProfessionalReview = createServerFn({ method: "POST" })
  .inputValidator(professionalReviewSchema)
  .handler(async ({ data }) => {
    const { triageId, ...body } = data;
    return fetchBackend(
      `/triages/${triageId}/professional-review`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
      patientTriageResponseSchema,
    );
  });

export const getFinalizedTriageDetails = createServerFn({ method: "GET" })
  .inputValidator(triageDetailsSchema)
  .handler(async ({ data }) => {
    const path =
      data.source === "patient-triage" ? `/triages/patient/${data.id}` : `/triages/${data.id}`;
    const details = await fetchBackend(path, {}, finalizedTriageDetailsSchema);
    return normalizeFinalizedTriageDetails(details);
  });

export const getAnalyticsMetrics = createServerFn({ method: "GET" })
  .inputValidator(analyticsMetricsInputSchema)
  .handler(async ({ data }) => {
    return fetchBackend(
      `/analytics/metrics?qualityPeriod=${encodeURIComponent(data.qualityPeriod)}`,
      {},
      analyticsMetricsSchema,
    );
  });

export const getModelConfig = createServerFn({ method: "GET" }).handler(async () => {
  return fetchBackend("/model-config", {}, modelConfigSchema);
});

export const createModelConfigVersion = createServerFn({ method: "POST" })
  .inputValidator(updateModelConfigSchema)
  .handler(async ({ data }) => {
    return fetchBackend(
      "/model-config/versions",
      { method: "POST", body: JSON.stringify(data) },
      modelConfigSchema,
    );
  });

async function fetchBackend<T>(
  path: string,
  init: RequestInit = {},
  responseSchema: z.ZodType<T>,
): Promise<T> {
  const baseUrl = (
    process.env.FALAI_BACKEND_URL ?? "https://backendfalaidoutor.vercel.app/api"
  ).replace(/\/$/, "");
  const applicationKey =
    process.env.FALAI_BACKEND_APPLICATION_KEY ?? process.env.APPLICATION_KEY ?? "";

  if (!applicationKey) {
    throw new Error(
      "FALAI_BACKEND_APPLICATION_KEY não está configurada no frontend. Configure essa variável na Vercel ou em .env.local com o mesmo valor de APPLICATION_KEY do backend.",
    );
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(applicationKey ? { "x-application-key": applicationKey } : {}),
        ...init.headers,
      },
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "erro de rede desconhecido";
    throw new Error(
      `Nao foi possivel conectar ao backend. Verifique se a API esta online e tente novamente. Detalhe: ${reason}`,
    );
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error(`Backend respondeu HTTP ${response.status} em ${baseUrl}${path}`, text);
    const authHint =
      response.status === 401
        ? " Verifique se FALAI_BACKEND_APPLICATION_KEY está configurada com a mesma APPLICATION_KEY do backend."
        : "";
    throw new Error(
      getFriendlyBackendErrorMessage(response.status, text, authHint),
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json();
  const parsed = responseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error(
      `Backend respondeu em formato inesperado em ${baseUrl}${path}. Detalhe: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "raiz"}: ${issue.message}`)
        .join("; ")}`,
    );
  }

  return parsed.data;
}

function getFriendlyBackendErrorMessage(status: number, responseText: string, authHint: string) {
  const backendMessage = getBackendMessage(responseText);

  if (backendMessage && backendDatabaseErrorPattern.test(backendMessage)) {
    return "Backend indisponivel: a base de dados do servidor nao esta configurada. Corrija o deploy do backend e tente novamente.";
  }

  if (backendMessage && backendModelConfigSchemaErrorPattern.test(backendMessage)) {
    return "Backend desatualizado: publique novamente o backend com a correção da tabela de configurações do modelo.";
  }

  if (backendMessage && backendModelConfigTableErrorPattern.test(backendMessage)) {
    return "A tabela de versões do modelo ainda não foi criada no banco de dados.";
  }

  if (status === 401) {
    return `Backend recusou a autenticacao.${authHint}`;
  }

  if (status >= 500) {
    return "Backend indisponivel no momento. Tente novamente mais tarde.";
  }

  return "Nao foi possivel concluir a solicitacao. Verifique os dados e tente novamente.";
}

function getBackendMessage(responseText: string) {
  if (!responseText) return null;

  try {
    const payload = JSON.parse(responseText) as { message?: unknown };
    if (Array.isArray(payload.message)) return payload.message.join(" ");
    if (typeof payload.message === "string") return payload.message;
  } catch {
    return responseText;
  }

  return null;
}

function normalizeList<T>(response: T[] | { data?: T[] | null; triages?: T[] | null } | null) {
  if (Array.isArray(response)) return response;
  return response?.data ?? response?.triages ?? [];
}

function normalizePendingReviewTriage(triage: PendingReviewTriage): PendingReviewTriage {
  return {
    ...triage,
    aiRecommendedAction: restorePortugueseAccents(triage.aiRecommendedAction),
  };
}

function normalizeFinalizedTriageDetails(details: FinalizedTriageDetails): FinalizedTriageDetails {
  const finalClassification = details.finalRiskClassification ?? details.classificacao;
  const finalNotes = details.professionalNotes ?? readString(details.finalResult, "professionalNotes");
  const finalJustification =
    finalNotes ??
    readString(details.finalResult, "justificativa") ??
    readString(details.finalResult, "justification") ??
    details.justificativa ??
    details.aiSummary ??
    "";

  return {
    ...details,
    classificacao: finalClassification,
    justificativa: restorePortugueseAccents(finalJustification) ?? "",
    professionalNotes: restorePortugueseAccents(finalNotes),
    aiSummary: restorePortugueseAccents(details.aiSummary),
    aiRecommendedAction: restorePortugueseAccents(details.aiRecommendedAction),
  };
}

function readString(record: JsonRecord | null | undefined, key: string) {
  const value = record?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}
