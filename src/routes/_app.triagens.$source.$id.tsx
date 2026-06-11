import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, ClipboardList, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  getFinalizedTriageDetails,
  type FinalizedTriageDetails,
  type EsiLevel,
} from "@/lib/backend-api";

export const Route = createFileRoute("/_app/triagens/$source/$id")({
  head: () => ({
    meta: [
      { title: "Detalhes da Triagem - FalAI Doutor" },
      {
        name: "description",
        content: "Detalhes da triagem analisada e classificação de risco confirmada.",
      },
    ],
  }),
  component: TriageDetailsPage,
});

type Source = "patient-triage" | "queue-triage";

function TriageDetailsPage() {
  const params = Route.useParams();
  const backRoute = params.source === "patient-triage" ? "/totem" : "/painel";
  const [details, setDetails] = useState<FinalizedTriageDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const id = Number(params.id);
      const source = params.source as Source;

      if (!Number.isFinite(id) || (source !== "patient-triage" && source !== "queue-triage")) {
        setError("Identificador de triagem inválido.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const result = await getFinalizedTriageDetails({ data: { id, source } });
        if (!cancelled) setDetails(result);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Não foi possível carregar a triagem.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [params.id, params.source]);

  return (
    <div className="mx-auto w-full max-w-5xl p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline" className="gap-2">
          <Link to={backRoute}>
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </div>

      {loading ? (
        <StateCard icon={<Loader2 className="h-6 w-6 animate-spin" />} title="Carregando triagem" />
      ) : error ? (
        <StateCard
          icon={<AlertCircle className="h-6 w-6" />}
          title="Não foi possível carregar"
          description={error}
        />
      ) : details ? (
        <DetailsContent details={details} />
      ) : null}
    </div>
  );
}

function DetailsContent({ details }: { details: FinalizedTriageDetails }) {
  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ClipboardList className="h-4 w-4" />
              Senha {details.queueTicket}
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {details.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {details.age} anos · {details.gender} · {details.createdAtDate} às{" "}
              {details.createdAtTime}
            </p>
          </div>
          <RiskBadge value={details.classificacao} />
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <InfoCard label="Nível" value={details.nivel ? String(details.nivel) : "-"} />
        <InfoCard label="Nome do nível" value={details.nome_nivel || "-"} />
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Relato do paciente</h2>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground">
          {details.symptoms || "Sem relato registrado."}
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Análise clínica</h2>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {details.professionalNotes ||
            details.justificativa ||
            details.aiSummary ||
            "Sem análise registrada."}
        </p>
      </section>

      {details.professionalNotes && details.aiSummary && (
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Resumo original da IA</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {details.aiSummary}
          </p>
        </section>
      )}

      {details.aiRecommendedAction && (
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Ação recomendada pela IA</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {details.aiRecommendedAction}
          </p>
        </section>
      )}

      {details.criterios_ponto_decisao.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Critérios do ponto de decisão</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {details.criterios_ponto_decisao.map((criterion) => (
              <li key={criterion}>{criterion}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-xl font-bold text-foreground">{value}</div>
    </div>
  );
}

function StateCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/60 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <h1 className="mt-4 text-lg font-semibold text-foreground">{title}</h1>
      {description && <p className="mt-1 max-w-xl text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

function RiskBadge({ value }: { value: string | null }) {
  const tone: Record<EsiLevel, string> = {
    "ESI-1": "bg-rose-500/10 text-rose-700 dark:text-rose-400",
    "ESI-2": "bg-orange-500/10 text-orange-700 dark:text-orange-400",
    "ESI-3": "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    "ESI-4": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    "ESI-5": "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  };
  const isEsi =
    value === "ESI-1" ||
    value === "ESI-2" ||
    value === "ESI-3" ||
    value === "ESI-4" ||
    value === "ESI-5";

  return (
    <span
      className={`inline-flex rounded-md px-3 py-1.5 text-sm font-semibold ${
        isEsi ? tone[value] : "bg-muted text-muted-foreground"
      }`}
    >
      {value || "Sem classificação"}
    </span>
  );
}
