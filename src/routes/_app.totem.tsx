import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  Loader2,
  Plus,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  authenticatePatient,
  listPatientTriagesFromBackend,
  type AuthResponse,
  type PatientTriage,
  type PatientTriageStatus,
} from "@/lib/backend-api";
import { formatCpf, getStatusLabel, normalizeCpf, readStoredCpf } from "@/lib/patient-triages";
import { readPatientSession, storePatientSession } from "@/lib/patient-session";

export const Route = createFileRoute("/_app/totem")({
  head: () => ({
    meta: [
      { title: "Minhas Triagens - FalAI Doutor" },
      {
        name: "description",
        content: "Acompanhamento assíncrono das triagens registradas pelo paciente.",
      },
    ],
  }),
  component: MyTriagesPage,
});

function MyTriagesPage() {
  const [cpf, setCpf] = useState("");
  const [activeCpf, setActiveCpf] = useState("");
  const [auth, setAuth] = useState<AuthResponse | null>(null);
  const [triages, setTriages] = useState<PatientTriage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingTriagesRef = useRef(false);

  const normalizedCpf = useMemo(() => normalizeCpf(cpf).slice(0, 11), [cpf]);
  const canSearch = normalizedCpf.length >= 1 && normalizedCpf.length <= 11;
  const isAuthenticated = auth?.authenticated === true;

  useEffect(() => {
    const session = readPatientSession();
    const stored = session?.cpf ?? readStoredCpf();
    if (!stored) return;
    if (session) setAuth({ authenticated: true, ...session });
    setCpf(stored);
    setActiveCpf(stored);
  }, []);

  useEffect(() => {
    if (!activeCpf) return;

    let cancelled = false;
    const load = async () => {
      if (loadingTriagesRef.current) return;
      loadingTriagesRef.current = true;

      setLoading(true);
      setError(null);
      try {
        const authResult = await authenticatePatient({ data: { cpf: activeCpf } });
        if (cancelled) return;
        setAuth(authResult);

        if (!authResult.authenticated) {
          setTriages([]);
          setError("CPF não localizado na base de pacientes.");
          return;
        }

        storePatientSession(authResult, activeCpf);
        const list = await listPatientTriagesFromBackend({ data: { cpf: activeCpf } });
        if (!cancelled) setTriages(list);
      } catch (err) {
        if (!cancelled) {
          setAuth(null);
          setTriages([]);
          setError(err instanceof Error ? err.message : "Não foi possível carregar as triagens.");
        }
      } finally {
        loadingTriagesRef.current = false;
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    const interval = window.setInterval(() => void load(), 5000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [activeCpf]);

  const submitCpfSearch = () => {
    if (!canSearch) return;
    setAuth(null);
    setTriages([]);
    setError(null);
    setActiveCpf(normalizedCpf);
  };

  return (
    <div className="mx-auto w-full max-w-6xl p-6 md:p-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            <ClipboardList className="h-6 w-6 text-primary" />
            Minhas Triagens
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Informe o CPF do paciente para consultar as triagens registradas e criar uma nova.
          </p>
        </div>
        <NewTriageButton enabled={isAuthenticated} />
      </header>

      <section className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          CPF do paciente
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={formatCpf(cpf)}
              onChange={(event) => setCpf(normalizeCpf(event.target.value).slice(0, 11))}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitCpfSearch();
                }
              }}
              placeholder="000.000.000-00"
              inputMode="numeric"
              maxLength={14}
              className="h-11 pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0"
            disabled={!canSearch || loading}
            onClick={submitCpfSearch}
            aria-label="Carregar paciente"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
          <NewTriageButton enabled={isAuthenticated} variant="outline" label="Criar nova triagem" />
        </div>
        {auth?.patientName && (
          <p className="mt-3 text-sm text-muted-foreground">
            Paciente: <span className="font-medium text-foreground">{auth.patientName}</span>
          </p>
        )}
      </section>

      {loading && triages.length === 0 ? (
        <EmptyState
          title="Carregando triagens"
          description="Consultando os registros do paciente no backend."
          icon={<Loader2 className="h-6 w-6 animate-spin" />}
        />
      ) : error ? (
        <EmptyState
          title="Não foi possível carregar"
          description={error}
          icon={<AlertCircle className="h-6 w-6" />}
        />
      ) : !activeCpf ? (
        <EmptyState
          title="Informe o CPF para carregar as triagens"
          description="Digite de 1 a 11 números e pressione Enter ou a lupa para carregar."
        />
      ) : triages.length === 0 ? (
        <EmptyState
          title="Nenhuma triagem registrada"
          description="Crie a primeira triagem para acompanhar o processamento assíncrono."
          action={<NewTriageButton enabled={isAuthenticated} label="Criar triagem" />}
        />
      ) : (
        <div className="grid gap-3">
          {triages.map((triage) => (
            <TriageRow key={triage.id} triage={triage} />
          ))}
        </div>
      )}
    </div>
  );
}

function NewTriageButton({
  enabled,
  variant,
  label = "Nova triagem",
}: {
  enabled: boolean;
  variant?: "outline";
  label?: string;
}) {
  if (!enabled) {
    return (
      <Button disabled variant={variant} className="gap-2">
        <Plus className="h-4 w-4" />
        {label}
      </Button>
    );
  }

  return (
    <Button asChild variant={variant} className="gap-2">
      <Link to="/triagem-inicial">
        <Plus className="h-4 w-4" />
        {label}
      </Link>
    </Button>
  );
}

function EmptyState({
  title,
  description,
  action,
  icon = <ClipboardList className="h-6 w-6" />,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/60 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <h2 className="mt-4 text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function TriageRow({ triage }: { triage: PatientTriage }) {
  const createdAt = new Date(triage.createdAt);
  const riskTone = getRiskTone(triage.riskClassification);
  const isAnalyzed = triage.status === "COMPLETED";

  return (
    <article
      className={`rounded-xl border border-l-4 p-5 shadow-sm transition-colors ${
        isAnalyzed ? riskTone.card : "border-l-border bg-card"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-primary">
              {triage.queueTicket}
            </span>
            <StatusBadge status={triage.status} />
            {isAnalyzed && triage.riskClassification && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${riskTone.badge}`}
                title="Classificação de risco confirmada"
              >
                <span className={`h-2 w-2 rounded-full ${riskTone.dot}`} />
                {triage.riskClassification}
              </span>
            )}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-foreground">{triage.symptomsPreview}</p>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Criada em{" "}
            {createdAt.toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}{" "}
            às{" "}
            {createdAt.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
        {triage.status === "COMPLETED" && (
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link
              to="/triagens/$source/$id"
              params={{ source: "patient-triage", id: String(triage.id) }}
            >
              <Eye className="h-4 w-4" />
              Detalhes
            </Link>
          </Button>
        )}
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: PatientTriageStatus }) {
  const tone: Record<PatientTriageStatus, string> = {
    PENDING: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    AI_PROCESSING: "bg-primary/10 text-primary",
    WAITING_PROFESSIONAL_REVIEW: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    COMPLETED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  };
  const icon =
    status === "COMPLETED" ? (
      <CheckCircle2 className="h-3.5 w-3.5" />
    ) : status === "AI_PROCESSING" ? (
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
    ) : null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${tone[status]}`}
    >
      {icon}
      {getStatusLabel(status)}
    </span>
  );
}

function getRiskTone(riskClassification: string | null) {
  const risk = riskClassification?.trim().toUpperCase();
  const tones: Record<string, { card: string; badge: string; dot: string }> = {
    "ESI-1": {
      card: "border-l-red-900 bg-red-950/5 dark:bg-red-950/20",
      badge: "bg-red-900/10 text-red-800 dark:text-red-300",
      dot: "bg-red-900",
    },
    "ESI-2": {
      card: "border-l-red-600 bg-red-500/5 dark:bg-red-950/20",
      badge: "bg-red-500/10 text-red-700 dark:text-red-300",
      dot: "bg-red-600",
    },
    "ESI-3": {
      card: "border-l-yellow-400 bg-yellow-400/10 dark:bg-yellow-950/20",
      badge: "bg-yellow-400/15 text-yellow-800 dark:text-yellow-300",
      dot: "bg-yellow-400",
    },
    "ESI-4": {
      card: "border-l-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/20",
      badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      dot: "bg-emerald-500",
    },
    "ESI-5": {
      card: "border-l-cyan-400 bg-cyan-400/5 dark:bg-cyan-950/20",
      badge: "bg-cyan-400/10 text-cyan-700 dark:text-cyan-300",
      dot: "bg-cyan-400",
    },
  };

  return (
    tones[risk ?? ""] ?? {
      card: "border-l-slate-500 bg-card",
      badge: "bg-muted text-foreground",
      dot: "bg-slate-500",
    }
  );
}
