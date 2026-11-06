import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ArrowLeft, Brain } from "lucide-react";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { PatientAnalysisSheet } from "@/components/triage/PatientAnalysisSheet";
import { MOCK_PATIENTS } from "@/lib/mock-patients";
import type { EsiLevel, PendingReviewTriage } from "@/lib/backend-api";

export const Route = createFileRoute("/prototipo")({
  head: () => ({ meta: [{ title: "Protótipo do Projeto | FalAI Doutor" }] }),
  component: PrototypePage,
});

const statuses = ["Em andamento", "Pendentes de revisão", "Analisadas"] as const;
const levels = ["ESI-1", "ESI-2", "ESI-3", "ESI-4", "ESI-5", "ESI-2"] as const;
const initialReviews: Record<
  number,
  { finalRiskClassification: EsiLevel; professionalNotes?: string }
> = {
  4: {
    finalRiskClassification: "ESI-4",
    professionalNotes: "Classificação confirmada na revisão simulada.",
  },
  5: {
    finalRiskClassification: "ESI-5",
    professionalNotes: "Classificação confirmada na revisão simulada.",
  },
};

function PrototypePage() {
  const [selected, setSelected] = useState<PendingReviewTriage | null>(null);
  const [reviews, setReviews] = useState(initialReviews);
  const [startedAt] = useState(Date.now);

  const cases = MOCK_PATIENTS.map((patient, index) => {
    const id = index + 1;
    const inProgress = id >= 6 || id === 2;
    const triage: PendingReviewTriage = {
      id,
      patientId: id,
      patientName: patient.patientName,
      patientAge: patient.age,
      patientGender: "Gênero não informado",
      symptoms: patient.symptoms,
      aiSummary: patient.aiJustification,
      aiSuggestedRiskClassification: levels[index],
      aiSuggestedRiskColor: null,
      aiRecommendedAction: null,
      aiResult: null,
      createdAt: new Date(startedAt).toISOString(),
      aiProcessedAt: null,
      queueTriageId: null,
      queueTicket: patient.ticket,
    };
    return {
      triage,
      review: reviews[id],
      status: reviews[id] ? statuses[2] : inProgress ? statuses[0] : statuses[1],
    };
  });

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-2 font-bold">
            <Activity className="size-5 text-primary" /> FalAI Doutor
          </div>
          <Button asChild variant="outline">
            <Link to="/login">
              <ArrowLeft className="size-4" /> Voltar ao login
            </Link>
          </Button>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-sm font-semibold text-primary">Protótipo do Projeto · Dados fictícios</p>
        <h1 className="mt-2 text-3xl font-bold">Painel de triagens</h1>
        <p className="mt-2 text-muted-foreground">
          Explore a coleta, a avaliação simulada da IA e a revisão profissional. As revisões feitas
          aqui duram até você sair do painel.
        </p>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {statuses.map((status) => {
            const items = cases.filter((item) => item.status === status);
            return (
              <section key={status} className="rounded-xl border bg-muted/40 p-4">
                <h2 className="mb-4 font-semibold">
                  {status} <span className="text-muted-foreground">({items.length})</span>
                </h2>
                <div className="space-y-3">
                  {items.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhuma triagem neste estágio.</p>
                  )}
                  {items.map(({ triage, review }) => (
                    <article key={triage.id} className="space-y-3 rounded-lg border bg-card p-4">
                      <div className="text-xs font-medium text-muted-foreground">
                        Senha {triage.queueTicket} · {triage.patientAge} anos
                      </div>
                      <h3 className="font-semibold">{triage.patientName}</h3>
                      <p className="text-sm text-muted-foreground">{triage.symptoms}</p>
                      {status === statuses[0] ? (
                        <p className="text-sm font-medium">Coleta de sintomas em andamento</p>
                      ) : (
                        <div className="rounded-md bg-primary/5 p-3 text-sm">
                          <p className="flex items-center gap-2 font-semibold">
                            <Brain className="size-4 text-primary" /> IA simulada ·{" "}
                            {triage.aiSuggestedRiskClassification}
                          </p>
                          <p className="mt-1">{triage.aiSummary}</p>
                          {review && (
                            <>
                              <p className="mt-3 font-semibold">
                                Classificação final · {review.finalRiskClassification}
                              </p>
                              {review.professionalNotes && (
                                <p className="mt-1">{review.professionalNotes}</p>
                              )}
                            </>
                          )}
                        </div>
                      )}
                      {status === statuses[1] && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setSelected(triage)}
                        >
                          Revisar avaliação da IA
                        </Button>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
      <PatientAnalysisSheet
        triage={selected}
        onClose={() => setSelected(null)}
        onValidate={(id, review) => setReviews((current) => ({ ...current, [id]: review }))}
      />
      <Toaster position="top-right" richColors />
    </main>
  );
}
