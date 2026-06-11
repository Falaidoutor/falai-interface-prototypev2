import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { restorePortugueseAccents } from "@/lib/portuguese-text";

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
  aiResult: Record<string, unknown> | null;
  createdAt: string;
  aiProcessedAt: string | null;
  queueTriageId: number | null;
  queueTicket: string | null;
};

export type ProfessionalReviewInput = {
  triageId: number;
  professionalId?: string;
  professionalNotes?: string;
  finalResult?: Record<string, unknown>;
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
  recursos_estimados: number;
  justificativa: string;
  createdAtDate: string;
  createdAtTime: string;
  aiRecommendedAction?: string | null;
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
  finalResult: z.record(z.unknown()).optional(),
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
  aiResult: z.record(z.unknown()).nullable(),
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
  recursos_estimados: z.number(),
  justificativa: z.string(),
  createdAtDate: z.string(),
  createdAtTime: z.string(),
  aiRecommendedAction: z.string().nullable().optional(),
});

const backendDatabaseErrorPattern = /tenant\/user postgres\.[\w-]+ not found/i;

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
  return {
    ...details,
    aiRecommendedAction: restorePortugueseAccents(details.aiRecommendedAction),
  };
}
