import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import {
  Activity,
  CheckCircle2,
  Cpu,
  Database,
  FileCode2,
  HardDrive,
  RotateCcw,
  Save,
  Zap,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createModelConfigVersion, getModelConfig, type ModelConfig } from "@/lib/backend-api";

export const Route = createFileRoute("/_app/config")({
  head: () => ({
    meta: [
      { title: "Configurações do Modelo" },
      {
        name: "description",
        content:
          "Console administrativo de modelos LLM, parâmetros de inferência e ajuste de prompt do sistema de triagem.",
      },
    ],
  }),
  component: ConfigPage,
});

type Tab = "status" | "prompt";
type ModelStatus = "active" | "standby" | "offline";

const models: {
  name: string;
  status: ModelStatus;
  role: string;
  latency: number;
  memory: number;
  context: string;
  throughput: string;
}[] = [
  {
    name: "qwen3_32b",
    status: "active",
    role: "Triagem clínica primária",
    latency: 42,
    memory: 68,
    context: "32k tokens",
    throughput: "84 tok/s",
  },
  {
    name: "llama3.3_70b",
    status: "standby",
    role: "Fallback / segunda opinião",
    latency: 96,
    memory: 41,
    context: "128k tokens",
    throughput: "47 tok/s",
  },
  {
    name: "medlama_8b_pt",
    status: "active",
    role: "NER clínico em português",
    latency: 19,
    memory: 22,
    context: "8k tokens",
    throughput: "210 tok/s",
  },
  {
    name: "mistral_small_3",
    status: "offline",
    role: "Reservado para validação noturna",
    latency: 0,
    memory: 0,
    context: "32k tokens",
    throughput: "-",
  },
];

const MODEL_OPTIONS = [
  {
    value: "llama-3.3-70b-versatile",
    label: "Llama 3.3 70B",
    description: "Modelo principal para triagem clínica via Groq.",
  },
  {
    value: "qwen/qwen3-32b",
    label: "Qwen 3 32B",
    description: "Alternativa de alta velocidade para triagem clínica.",
  },
  {
    value: "openai/gpt-oss-120b",
    label: "GPT OSS 120B",
    description: "Modelo de maior capacidade disponível no provedor.",
  },
] as const;

const DEFAULT_PROMPT = `Você é o FalAI Doutor, um assistente de triagem clínica.
Sua tarefa é classificar pacientes segundo critérios ESI com base no relato do paciente.

Regras obrigatórias:
1. Extraia entidades clínicas: sintomas, duração, intensidade e sinais vitais.
2. Identifique sinais de alarme e priorize-os.
3. Justifique a classificação citando o nível ESI.
4. Nunca prescreva conduta; apenas indique prioridade de atendimento.
5. Em caso de baixa confiança, retorne escalonamento manual.`;

function ConfigPage() {
  const [tab, setTab] = useState<Tab>("status");
  const [temperature, setTemperature] = useState(0.2);
  const [topP, setTopP] = useState(0.9);
  const [ragEnabled, setRagEnabled] = useState(true);
  const [streaming, setStreaming] = useState(true);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [applied, setApplied] = useState(false);
  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null);
  const [modelName, setModelName] = useState("llama-3.3-70b-versatile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tokenEstimate = useMemo(() => Math.ceil(prompt.length / 4), [prompt]);

  useEffect(() => {
    void (async () => {
      try {
        const config = await getModelConfig();
        setModelConfig(config);
        setModelName(config.modelName);
        setPrompt(config.systemPrompt);
        setTemperature(config.temperature);
        setTopP(config.topP);
        setRagEnabled(config.ragEnabled);
        setStreaming(config.streamingEnabled);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível carregar a configuração do modelo.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveConfig = async () => {
    setSaving(true);
    setError(null);
    try {
      const saved = await createModelConfigVersion({
        data: {
          modelName,
          provider: modelConfig?.provider ?? "groq",
          systemPrompt: prompt,
          temperature,
          topP,
          ragEnabled,
          streamingEnabled: streaming,
          versionLabel: `config-${new Date().toISOString()}`,
          createdBy: "admin",
        },
      });
      setModelConfig(saved);
      setModelName(saved.modelName);
      setApplied(true);
      window.setTimeout(() => setApplied(false), 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar a configuração.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            <Cpu className="h-6 w-6 text-primary" />
            Configurações do Modelo
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Console administrativo de LLMs, parâmetros de inferência e comportamento de triagem.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Cluster GPU saudável
        </div>
      </header>

      {loading ? (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" /> Carregando configuração vigente...
        </div>
      ) : null}
      {error ? (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-rose-700 dark:text-rose-300">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      ) : null}

      <div className="mb-6 inline-flex rounded-lg bg-muted p-1 text-sm text-muted-foreground">
        <TabButton active={tab === "status"} onClick={() => setTab("status")} icon={Activity}>
          Status dos Modelos
        </TabButton>
        <TabButton active={tab === "prompt"} onClick={() => setTab("prompt")} icon={FileCode2}>
          Ajuste de Prompt / RAG
        </TabButton>
      </div>

      {tab === "status" ? (
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard icon={Zap} label="Latência média" value="42ms" hint="p50 24h" />
            <SummaryCard icon={HardDrive} label="Memória VRAM" value="68%" hint="48,2 / 80 GB" />
            <SummaryCard
              icon={Database}
              label="Embeddings RAG"
              value="1,2M"
              hint="Protocolos + diretrizes"
            />
            <SummaryCard
              icon={Activity}
              label="Inferências hoje"
              value="3.481"
              hint="+8% vs ontem"
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            {models.map((model) => (
              <ModelCard key={model.name} model={model} />
            ))}
          </section>
        </div>
      ) : (
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2">
              <span className="font-mono text-xs text-muted-foreground">system_prompt.md</span>
              <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
                {modelName}
              </span>
            </div>
            <textarea
              value={prompt}
              onChange={(event) => {
                setPrompt(event.target.value);
                setApplied(false);
              }}
              spellCheck={false}
              className="block min-h-[340px] w-full resize-y bg-card p-4 font-mono text-[13px] leading-relaxed text-foreground outline-none"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 px-4 py-2.5">
              <div className="font-mono text-[11px] text-muted-foreground">
                {prompt.length} caracteres · ~{tokenEstimate} tokens
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    setPrompt(DEFAULT_PROMPT);
                    setApplied(false);
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Restaurar
                </Button>
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => void saveConfig()}
                  disabled={saving || loading}
                >
                  {applied ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  {saving ? "Salvando..." : applied ? "Aplicado" : "Aplicar"}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-foreground">Modelo em uso</h2>
              <p className="text-xs text-muted-foreground">
                A próxima triagem usará o modelo selecionado após aplicar a nova versão.
              </p>
              <div className="mt-4">
                <label className="block text-xs font-semibold text-foreground" htmlFor="model-name">
                  Modelo
                </label>
                <select
                  id="model-name"
                  value={modelName}
                  onChange={(event) => {
                    setModelName(event.target.value);
                    setApplied(false);
                  }}
                  className="mt-1.5 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  disabled={saving || loading}
                >
                  {!MODEL_OPTIONS.some((option) => option.value === modelName) ? (
                    <option value={modelName}>{modelName}</option>
                  ) : null}
                  {MODEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {MODEL_OPTIONS.find((option) => option.value === modelName)?.description ?? "Modelo configurado no backend."}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-foreground">Parâmetros de inferência</h2>
              <p className="text-xs text-muted-foreground">
                Ajuste o equilíbrio entre determinismo clínico e abrangência.
              </p>
              <div className="mt-5 space-y-5">
                <RangeField
                  label="Temperature"
                  hint="0.1 determinismo · 1.0 criatividade"
                  value={temperature}
                  onChange={(value) => {
                    setTemperature(value);
                    setApplied(false);
                  }}
                  min={0.1}
                  max={1}
                  step={0.05}
                />
                <RangeField
                  label="Top-p"
                  hint="0.1 focado · 1.0 abrangente"
                  value={topP}
                  onChange={(value) => {
                    setTopP(value);
                    setApplied(false);
                  }}
                  min={0.1}
                  max={1}
                  step={0.05}
                />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-foreground">RAG & Runtime</h2>
              <div className="mt-4 space-y-4">
                <CheckRow
                  label="RAG clínico"
                  desc="Recupera diretrizes e protocolos por similaridade."
                  checked={ragEnabled}
                  onChange={(value) => {
                    setRagEnabled(value);
                    setApplied(false);
                  }}
                />
                <CheckRow
                  label="Streaming de tokens"
                  desc="Resposta progressiva no painel clínico."
                  checked={streaming}
                  onChange={(value) => {
                    setStreaming(value);
                    setApplied(false);
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-3 py-1.5 font-medium transition-colors",
        active ? "bg-background text-foreground shadow-sm" : "hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold text-foreground">{value}</div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>
    </div>
  );
}

function ModelCard({ model }: { model: (typeof models)[number] }) {
  const tone =
    model.status === "active"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      : model.status === "standby"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
        : "border-border bg-muted text-muted-foreground";

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            <span className="font-mono text-sm font-semibold text-foreground">{model.name}</span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{model.role}</p>
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tone}`}>
          {model.status}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 text-xs">
        <Stat label="Latência" value={model.latency ? `${model.latency} ms` : "-"} />
        <Stat label="Throughput" value={model.throughput} />
        <Stat label="Contexto" value={model.context} />
        <div>
          <Stat label="VRAM" value={`${model.memory}%`} />
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-primary/20">
            <div className="h-full rounded-full bg-primary" style={{ width: `${model.memory}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono font-semibold text-foreground">{value}</div>
    </div>
  );
}

function RangeField({
  label,
  hint,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">{label}</span>
        <span className="font-mono text-xs font-semibold text-primary">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-primary"
      />
      <div className="mt-1 text-[10px] text-muted-foreground">{hint}</div>
    </label>
  );
}

function CheckRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3">
      <span>
        <span className="block text-xs font-semibold text-foreground">{label}</span>
        <span className="block text-[11px] text-muted-foreground">{desc}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 accent-primary"
      />
    </label>
  );
}
