import { createFileRoute, Link } from "@tanstack/react-router";
import { MessagesSquare, Brain, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "FalAI Doutor — Triagem Inteligente" },
      {
        name: "description",
        content:
          "Sistema de triagem hospitalar com IA generativa, integrando Protocolo Manchester e ESI para apoiar decisões clínicas.",
      },
    ],
  }),
  component: HomePage,
});

const flow = [
  {
    icon: MessagesSquare,
    step: "01",
    title: "Coleta RAG",
    text: "Paciente descreve sintomas em totem por voz ou texto. IA conversacional faz perguntas direcionadas e estrutura o relato.",
  },
  {
    icon: Brain,
    step: "02",
    title: "Análise ESI / Manchester",
    text: "Modelo recupera diretrizes clínicas e cruza com sinais relatados, gerando classificação preliminar de risco e justificativa.",
  },
  {
    icon: ShieldCheck,
    step: "03",
    title: "Validação Humana",
    text: "Médico ou enfermeiro revisa raciocínio da IA no painel clínico, confirma ou ajusta classificação e encaminha o paciente.",
  },
];

function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-24">
      <section className="flex flex-col items-center text-center">
        <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          Plataforma clínica · v1.0
        </span>
        <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
          Triagem Inteligente,
          <br />
          <span className="text-primary">Decisões Precisas</span>
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          FalAI Doutor integra IA generativa ao fluxo hospitalar para otimizar o atendimento,
          reduzir o tempo de classificação de risco e apoiar decisões clínicas com base no Protocolo
          Manchester e ESI.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="gap-2">
            <Link to="/painel">
              Acessar Sistema <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/totem">Minhas triagens</Link>
          </Button>
        </div>
      </section>

      <section className="mt-24">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Arquitetura do fluxo clínico
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Três etapas auditáveis, com IA assistindo o profissional — nunca substituindo a
              decisão humana.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {flow.map((f) => (
            <article
              key={f.step}
              className="group relative flex flex-col rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold tracking-widest text-muted-foreground">
                  {f.step}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
