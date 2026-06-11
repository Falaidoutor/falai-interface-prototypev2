import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PatientAnalysisSheet } from "@/components/triage/PatientAnalysisSheet";
import { AlertCircle, ClipboardCheck, Eye, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  listMedicalQueueCases,
  listPendingReviewTriages,
  submitProfessionalReview,
  type EsiLevel,
  type MedicalQueueCase,
  type PendingReviewTriage,
  type ProfessionalReviewInput,
} from "@/lib/backend-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/painel")({
  head: () => ({
    meta: [
      { title: "Painel Clínico - FalAI Doutor" },
      {
        name: "description",
        content:
          "Fila de triagem ativa com classificações ESI sugeridas e confirmadas por profissionais.",
      },
    ],
  }),
  component: PainelPage,
});

type PanelTab = "pending" | "analyzed";

const PENDING_STATUSES = new Set(["PENDING", "AI_PROCESSING", "WAITING_PROFESSIONAL_REVIEW"]);
const RISK_ORDER: Record<EsiLevel, number> = {
  "ESI-1": 0,
  "ESI-2": 1,
  "ESI-3": 2,
  "ESI-4": 3,
  "ESI-5": 4,
};

function elapsed(date: string) {
  const sec = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function toReviewedQueueCase(
  triage: PendingReviewTriage,
  review: Pick<
    ProfessionalReviewInput,
    "finalRiskClassification" | "finalRiskColor" | "professionalNotes"
  >,
): MedicalQueueCase {
  return {
    queueId: triage.queueTriageId ?? triage.id,
    triageId: triage.id,
    source: "patient-triage",
    name: triage.patientName,
    gender: triage.patientGender,
    age: triage.patientAge,
    queueTicket: triage.queueTicket ?? `#${triage.id}`,
    classificacao: review.finalRiskClassification,
    prioridade: getPriorityLabel(review.finalRiskClassification),
    status: "COMPLETED",
  };
}

function upsertReviewedCase(rows: MedicalQueueCase[], reviewedCase: MedicalQueueCase) {
  const key = getCaseKey(reviewedCase);
  const existingIndex = rows.findIndex((item) => getCaseKey(item) === key);

  if (existingIndex === -1) {
    return [reviewedCase, ...rows];
  }

  return rows.map((item, index) => (index === existingIndex ? reviewedCase : item));
}

function getCaseKey(item: MedicalQueueCase) {
  return `${item.source ?? "queue-triage"}-${item.triageId ?? item.queueId}`;
}

function getPriorityLabel(level: EsiLevel) {
  const labels: Record<EsiLevel, string> = {
    "ESI-1": "Imediata",
    "ESI-2": "Muito alta",
    "ESI-3": "Alta",
    "ESI-4": "Moderada",
    "ESI-5": "Baixa",
  };

  return labels[level];
}

function PainelPage() {
  const [activeTab, setActiveTab] = useState<PanelTab>("pending");
  const [pendingTriages, setPendingTriages] = useState<PendingReviewTriage[]>([]);
  const [queueCases, setQueueCases] = useState<MedicalQueueCase[]>([]);
  const [selected, setSelected] = useState<PendingReviewTriage | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const loadingQueueRef = useRef(false);

  const load = async (force = false) => {
    if (loadingQueueRef.current && !force) return;
    loadingQueueRef.current = true;

    try {
      setError(null);
      const [pendingRows, queueRows] = await Promise.all([
        listPendingReviewTriages(),
        listMedicalQueueCases(),
      ]);
      setPendingTriages(pendingRows);
      setQueueCases(queueRows);
      return { pendingRows, queueRows };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar a fila clínica.");
      return null;
    } finally {
      setLoading(false);
      loadingQueueRef.current = false;
    }
  };

  useEffect(() => {
    void load();
    const refresh = window.setInterval(() => void load(), 7000);
    const timer = window.setInterval(() => setTick((value) => value + 1), 1000);

    return () => {
      window.clearInterval(refresh);
      window.clearInterval(timer);
    };
  }, []);

  const filteredPending = useMemo(() => {
    const rows = pendingTriages.filter(
      (triage) =>
        !query ||
        triage.patientName.toLowerCase().includes(query.toLowerCase()) ||
        (triage.queueTicket ?? "").toLowerCase().includes(query.toLowerCase()),
    );

    return [...rows].sort((a, b) => {
      const aRisk = toEsiLevel(a.aiSuggestedRiskClassification);
      const bRisk = toEsiLevel(b.aiSuggestedRiskClassification);
      return (
        (aRisk ? RISK_ORDER[aRisk] : 99) - (bRisk ? RISK_ORDER[bRisk] : 99) ||
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });
  }, [pendingTriages, query]);

  const analyzedCases = useMemo(() => {
    const rows = queueCases.filter((item) => {
      const hasConfirmedRisk = !!toEsiLevel(item.classificacao);
      const isPending = item.status ? PENDING_STATUSES.has(item.status) : false;
      return hasConfirmedRisk && !isPending;
    });

    const filtered = rows.filter(
      (item) =>
        !query ||
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.queueTicket.toLowerCase().includes(query.toLowerCase()) ||
        item.classificacao.toLowerCase().includes(query.toLowerCase()),
    );

    return [...filtered].sort((a, b) => {
      const aRisk = toEsiLevel(a.classificacao);
      const bRisk = toEsiLevel(b.classificacao);
      return (
        (aRisk ? RISK_ORDER[aRisk] : 99) - (bRisk ? RISK_ORDER[bRisk] : 99) ||
        a.queueTicket.localeCompare(b.queueTicket)
      );
    });
  }, [queueCases, query]);

  const handleValidate = async (
    id: number,
    review: Pick<
      ProfessionalReviewInput,
      "finalRiskClassification" | "finalRiskColor" | "professionalNotes"
    >,
  ) => {
    const reviewedTriage = selected;
    const reviewedCase = reviewedTriage ? toReviewedQueueCase(reviewedTriage, review) : null;

    await submitProfessionalReview({
      data: {
        triageId: id,
        finalResult: { source: "falai-interface", reviewedAt: new Date().toISOString() },
        ...review,
      },
    });

    if (reviewedCase) {
      setPendingTriages((rows) => rows.filter((triage) => triage.id !== reviewedTriage?.id));
      setQueueCases((rows) => upsertReviewedCase(rows, reviewedCase));
    }

    setSelected(null);
    setActiveTab("analyzed");
    await load(true);

    if (reviewedCase) {
      setQueueCases((rows) => upsertReviewedCase(rows, reviewedCase));
    }
  };

  const criticalPending = pendingTriages.filter((triage) => {
    const level = toEsiLevel(triage.aiSuggestedRiskClassification);
    return level === "ESI-1" || level === "ESI-2";
  }).length;

  const criticalAnalyzed = analyzedCases.filter((item) => {
    const level = toEsiLevel(item.classificacao);
    return level === "ESI-1" || level === "ESI-2";
  }).length;

  return (
    <div className="p-6 md:p-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Painel Clínico
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {pendingTriages.length} pendentes · {analyzedCases.length} analisadas ·{" "}
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              {activeTab === "pending" ? criticalPending : criticalAnalyzed}
            </span>{" "}
            críticas
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar nome, senha ou risco..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-9 w-72 pl-9"
          />
        </div>
      </header>

      <div className="mb-4 inline-flex rounded-lg bg-muted p-1 text-sm text-muted-foreground">
        <TabButton active={activeTab === "pending"} onClick={() => setActiveTab("pending")}>
          Pendentes de análise
          <span className="ml-2 rounded bg-background px-1.5 py-0.5 text-[11px] text-foreground">
            {pendingTriages.length}
          </span>
        </TabButton>
        <TabButton active={activeTab === "analyzed"} onClick={() => setActiveTab("analyzed")}>
          Triagens analisadas
          <span className="ml-2 rounded bg-background px-1.5 py-0.5 text-[11px] text-foreground">
            {analyzedCases.length}
          </span>
        </TabButton>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {loading ? (
          <PanelState icon={<Loader2 className="h-5 w-5 animate-spin" />} title="Carregando fila" />
        ) : error ? (
          <PanelState icon={<AlertCircle className="h-5 w-5" />} title={error} />
        ) : activeTab === "pending" ? (
          <PendingTable rows={filteredPending} onAnalyze={setSelected} />
        ) : (
          <AnalyzedTable rows={analyzedCases} />
        )}
      </div>

      <PatientAnalysisSheet
        triage={selected}
        onClose={() => setSelected(null)}
        onValidate={handleValidate}
      />
    </div>
  );
}

function PendingTable({
  rows,
  onAnalyze,
}: {
  rows: PendingReviewTriage[];
  onAnalyze: (triage: PendingReviewTriage) => void;
}) {
  if (rows.length === 0) {
    return (
      <PanelState
        icon={<ClipboardCheck className="h-5 w-5" />}
        title="Nenhuma triagem aguardando revisão"
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-[100px]">Fila</TableHead>
            <TableHead>Paciente</TableHead>
            <TableHead className="w-[140px]">Tempo de Espera</TableHead>
            <TableHead className="w-[160px]">Risco Previsto</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[120px] text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((triage) => (
            <TableRow key={triage.id} className="transition-colors duration-200 hover:bg-accent/40">
              <TableCell className="font-mono text-sm font-semibold text-foreground">
                {triage.queueTicket ?? `#${triage.id}`}
              </TableCell>
              <TableCell>
                <div className="font-medium text-foreground">{triage.patientName}</div>
                <div className="text-xs text-muted-foreground">
                  {triage.patientAge} anos · {triage.patientGender}
                </div>
              </TableCell>
              <TableCell>
                <span className="font-mono text-sm tabular-nums text-foreground">
                  {elapsed(triage.createdAt)}
                </span>
              </TableCell>
              <TableCell>
                <RiskBadge value={triage.aiSuggestedRiskClassification} />
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                  Aguardando revisão
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Button size="sm" onClick={() => onAnalyze(triage)}>
                  Analisar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function AnalyzedTable({ rows }: { rows: MedicalQueueCase[] }) {
  if (rows.length === 0) {
    return (
      <PanelState
        icon={<ClipboardCheck className="h-5 w-5" />}
        title="Nenhuma triagem analisada na fila atual"
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-[100px]">Fila</TableHead>
            <TableHead>Paciente</TableHead>
            <TableHead className="w-[220px]">Risco Confirmado</TableHead>
            <TableHead className="w-[160px]">Origem</TableHead>
            <TableHead className="w-[120px] text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((item) => (
            <TableRow
              key={`${item.source ?? "queue"}-${item.triageId ?? item.queueId}`}
              className="transition-colors duration-200 hover:bg-accent/40"
            >
              <TableCell className="font-mono text-sm font-semibold text-foreground">
                {item.queueTicket}
              </TableCell>
              <TableCell>
                <div className="font-medium text-foreground">{item.name}</div>
                <div className="text-xs text-muted-foreground">
                  {item.age} anos · {item.gender}
                </div>
              </TableCell>
              <TableCell>
                <RiskBadge value={item.classificacao} showDescription />
              </TableCell>
              <TableCell>
                <span className="text-xs text-muted-foreground">
                  {item.source === "patient-triage" ? "Triagem assíncrona" : "Fila clínica"}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <Link
                    to="/triagens/$source/$id"
                    params={{
                      source: item.source === "patient-triage" ? "patient-triage" : "queue-triage",
                      id: String(
                        item.source === "patient-triage"
                          ? (item.triageId ?? item.queueId)
                          : item.queueId,
                      ),
                    }}
                  >
                    <Eye className="h-4 w-4" />
                    Detalhes
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-md px-3 py-1.5 font-medium transition-colors",
        active ? "bg-background text-foreground shadow-sm" : "hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function PanelState({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="text-sm font-medium">{title}</p>
    </div>
  );
}

function RiskBadge({
  value,
  showDescription = false,
}: {
  value: string | null;
  showDescription?: boolean;
}) {
  const level = toEsiLevel(value);
  const tone: Record<EsiLevel, string> = {
    "ESI-1": "bg-rose-500/10 text-rose-700 dark:text-rose-400",
    "ESI-2": "bg-orange-500/10 text-orange-700 dark:text-orange-400",
    "ESI-3": "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    "ESI-4": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    "ESI-5": "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  };
  const descriptions: Record<EsiLevel, string> = {
    "ESI-1": "Ressuscitação",
    "ESI-2": "Emergente",
    "ESI-3": "Urgente",
    "ESI-4": "Menos urgente",
    "ESI-5": "Não urgente",
  };

  if (!level) {
    return (
      <span className="inline-flex rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
        {value || "Sem sugestão"}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${tone[level]}`}
    >
      <span>{level}</span>
      {showDescription ? (
        <span className="border-l border-current/30 pl-1.5">{descriptions[level]}</span>
      ) : null}
    </span>
  );
}

function toEsiLevel(value: string | null | undefined): EsiLevel | null {
  if (
    value === "ESI-1" ||
    value === "ESI-2" ||
    value === "ESI-3" ||
    value === "ESI-4" ||
    value === "ESI-5"
  ) {
    return value;
  }
  return null;
}
