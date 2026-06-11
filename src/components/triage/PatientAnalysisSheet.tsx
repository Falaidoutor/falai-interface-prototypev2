import { useEffect, useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import type { EsiLevel, JsonValue, PendingReviewTriage } from "@/lib/backend-api";
import {
  Activity,
  ArrowDownCircle,
  ArrowUpCircle,
  Brain,
  Check,
  Clock,
  FileText,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ReviewPayload = {
  finalRiskClassification: EsiLevel;
  finalRiskColor: string;
  professionalNotes?: string;
};

interface Props {
  triage: PendingReviewTriage | null;
  onClose: () => void;
  onValidate: (id: number, review: ReviewPayload) => Promise<void> | void;
}

const ESI_META: Record<EsiLevel, { label: string; color: string; description: string }> = {
  "ESI-1": {
    label: "ESI-1",
    color: "#dc2626",
    description: "Risco imediato ou necessidade de intervenção salvadora.",
  },
  "ESI-2": {
    label: "ESI-2",
    color: "#ea580c",
    description: "Alto risco, dor intensa, confusão, letargia ou desorientação.",
  },
  "ESI-3": {
    label: "ESI-3",
    color: "#ca8a04",
    description: "Estável, com necessidade provável de múltiplos recursos.",
  },
  "ESI-4": {
    label: "ESI-4",
    color: "#16a34a",
    description: "Estável, com necessidade provável de um recurso.",
  },
  "ESI-5": {
    label: "ESI-5",
    color: "#2563eb",
    description: "Estável, sem necessidade prevista de recursos diagnósticos.",
  },
};

const LEVELS: EsiLevel[] = ["ESI-1", "ESI-2", "ESI-3", "ESI-4", "ESI-5"];

export function PatientAnalysisSheet({ triage, onClose, onValidate }: Props) {
  const [loading, setLoading] = useState(false);
  const [choice, setChoice] = useState<EsiLevel | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!triage) return;
    setLoading(true);
    setNotes("");
    setChoice(null);
    const id = window.setTimeout(() => {
      setLoading(false);
      setChoice(toEsiLevel(triage.aiSuggestedRiskClassification) ?? "ESI-3");
    }, 350);
    return () => window.clearTimeout(id);
  }, [triage]);

  const elapsed = triage
    ? Math.floor((Date.now() - new Date(triage.createdAt).getTime()) / 60000)
    : 0;

  const confidence = useMemo(() => {
    return extractConfidence(triage?.aiResult);
  }, [triage]);

  const extracted = useMemo(() => extractClinicalItems(triage?.aiResult), [triage?.aiResult]);
  const aiLevel = toEsiLevel(triage?.aiSuggestedRiskClassification);
  const higherAiLevel = aiLevel ? shiftLevel(aiLevel, -1) : null;
  const lowerAiLevel = aiLevel ? shiftLevel(aiLevel, 1) : null;

  const shift = (dir: -1 | 1) => {
    if (!choice) return;
    const idx = LEVELS.indexOf(choice);
    const next = Math.max(0, Math.min(LEVELS.length - 1, idx + dir));
    setChoice(LEVELS[next]);
    toast.info(dir < 0 ? "Risco elevado" : "Risco rebaixado", {
      description: `Nova classificação: ${LEVELS[next]}.`,
    });
  };

  const confirm = async () => {
    if (!triage || !choice) return;
    setSaving(true);
    try {
      await onValidate(triage.id, {
        finalRiskClassification: choice,
        finalRiskColor: ESI_META[choice].color,
        professionalNotes: notes.trim() || undefined,
      });
      toast.success("Triagem validada", {
        description: `${triage.patientName} classificado como ${choice}.`,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={!!triage} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex h-full w-full flex-col overflow-hidden sm:max-w-xl">
        {triage && (
          <>
            <SheetHeader className="space-y-2 border-b border-border pb-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <SheetTitle className="text-lg">{triage.patientName}</SheetTitle>
                  <SheetDescription className="text-xs">
                    Senha {triage.queueTicket ?? "sem senha"} · {triage.patientAge} anos ·{" "}
                    {triage.patientGender}
                  </SheetDescription>
                </div>
                <div className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {elapsed} min de espera
                </div>
              </div>
            </SheetHeader>

            <div className="-mx-6 flex-1 space-y-6 overflow-y-auto px-6 py-5">
              <section>
                <SectionTitle icon={FileText} title="Relato do paciente" />
                <blockquote className="mt-3 rounded-md border-l-4 border-primary/60 bg-muted/50 p-4 text-sm leading-relaxed text-foreground">
                  {triage.symptoms}
                </blockquote>
              </section>

              <section>
                <SectionTitle icon={Brain} title="Confiança & Extração da IA" badge="IA" />
                {loading ? (
                  <div className="mt-3 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-9/12" />
                  </div>
                ) : (
                  <div className="mt-3 space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">Confiança da IA</span>
                        <span className="font-mono font-semibold text-foreground">
                          {confidence === null ? "Não retornada" : `${confidence}%`}
                        </span>
                      </div>
                      {confidence === null ? (
                        <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                          O backend não retornou um campo de confiança numérico no resultado da IA.
                        </div>
                      ) : (
                        <Progress value={confidence} className="h-2" />
                      )}
                    </div>
                    <div>
                      <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        Entidades clínicas extraídas
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {extracted.length ? (
                          extracted.map((item) => (
                            <span
                              key={item}
                              className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary"
                            >
                              {item}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Sem entidades estruturadas retornadas.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <section>
                <SectionTitle icon={Sparkles} title="Raciocínio clínico da IA" badge="ESI" />
                {loading ? (
                  <div className="mt-3 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-11/12" />
                    <Skeleton className="h-4 w-9/12" />
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {triage.aiSummary ?? "A IA ainda não retornou um resumo estruturado."}
                    </p>
                    {triage.aiRecommendedAction && (
                      <div className="rounded-md border border-border bg-card p-3 text-xs text-foreground">
                        <div className="flex gap-2">
                          <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                          <span>{triage.aiRecommendedAction}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>

              <section>
                <SectionTitle icon={Zap} title="Ações rápidas" />
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start gap-2"
                    disabled={!aiLevel}
                    onClick={() => {
                      if (!aiLevel) return;
                      setChoice(aiLevel);
                      toast.success(`Sugestão da IA confirmada: ${aiLevel}`);
                    }}
                  >
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Confirmar {aiLevel ?? "sugestão IA"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start gap-2"
                    disabled={!higherAiLevel}
                    onClick={() => {
                      if (!higherAiLevel) return;
                      setChoice(higherAiLevel);
                      toast.info("Risco elevado a partir da IA", {
                        description: `Nova classificação: ${higherAiLevel}.`,
                      });
                    }}
                  >
                    <ArrowUpCircle className="h-4 w-4 text-rose-500" />
                    Elevar para {higherAiLevel ?? "-"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start gap-2"
                    disabled={!lowerAiLevel}
                    onClick={() => {
                      if (!lowerAiLevel) return;
                      setChoice(lowerAiLevel);
                      toast.info("Risco rebaixado a partir da IA", {
                        description: `Nova classificação: ${lowerAiLevel}.`,
                      });
                    }}
                  >
                    <ArrowDownCircle className="h-4 w-4 text-emerald-500" />
                    Rebaixar para {lowerAiLevel ?? "-"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start gap-2"
                    disabled={!triage.aiRecommendedAction}
                    onClick={() => {
                      if (!triage.aiRecommendedAction) return;
                      setNotes((current) =>
                        current.trim()
                          ? `${current.trim()}\n\nAção recomendada pela IA: ${triage.aiRecommendedAction}`
                          : `Ação recomendada pela IA: ${triage.aiRecommendedAction}`,
                      );
                      toast.success("Ação da IA adicionada às observações");
                    }}
                  >
                    <Activity className="h-4 w-4 text-primary" />
                    Usar ação da IA
                  </Button>
                </div>
              </section>

              <section>
                <SectionTitle icon={Check} title="Decisão clínica" />
                <p className="mt-1 text-xs text-muted-foreground">
                  Selecione o nível ESI confirmado para concluir a revisão.
                </p>
                <div className="mt-3 grid gap-2">
                  {LEVELS.map((level) => {
                    const meta = ESI_META[level];
                    const isAi = toEsiLevel(triage.aiSuggestedRiskClassification) === level;
                    const isSelected = choice === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setChoice(level)}
                        className={cn(
                          "group flex items-center gap-3 rounded-lg border p-3 text-left transition-all duration-200",
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border bg-card hover:border-primary/40",
                        )}
                      >
                        <span
                          className="h-9 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: meta.color }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {meta.label}
                            </span>
                            {isAi && (
                              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                Sugestão IA
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{meta.description}</div>
                        </div>
                        <div
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded-full border-2",
                            isSelected ? "border-primary bg-primary" : "border-border",
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <SectionTitle icon={FileText} title="Observações profissionais" />
                <Textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Registre observações clínicas da revisão..."
                  className="mt-3 min-h-24"
                />
              </section>
            </div>

            <SheetFooter className="-mx-6 mt-auto shrink-0 border-t border-border bg-card px-6 py-4 sm:justify-between">
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button disabled={!choice || loading || saving} onClick={confirm} className="gap-2">
                <Check className="h-4 w-4" />
                {saving ? "Validando..." : "Validar e Encaminhar"}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  badge,
}: {
  icon: typeof FileText;
  title: string;
  badge?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {badge && (
        <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {badge}
        </span>
      )}
    </div>
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

function shiftLevel(level: EsiLevel, dir: -1 | 1): EsiLevel | null {
  const idx = LEVELS.indexOf(level);
  const next = idx + dir;
  return LEVELS[next] ?? null;
}

function extractConfidence(result: Record<string, JsonValue> | null | undefined) {
  if (!result) return null;

  const candidates = [
    result.confidence,
    result.confianca,
    result.confidenceScore,
    result.score,
    result.probability,
    getNestedValue(result, ["metadata", "confidence"]),
    getNestedValue(result, ["metadata", "confianca"]),
    getNestedValue(result, ["classification", "confidence"]),
    getNestedValue(result, ["classificacao", "confianca"]),
  ];

  for (const candidate of candidates) {
    const value = toNumber(candidate);
    if (value !== null) {
      return Math.max(0, Math.min(100, Math.round(value * (value <= 1 ? 100 : 1))));
    }
  }

  return null;
}

function extractClinicalItems(result: Record<string, JsonValue> | null | undefined) {
  if (!result) return [];
  const candidates = [
    result.symptoms,
    result.sintomas,
    result.extractedSymptoms,
    result.extracted_symptoms,
    result.entidades,
    result.clinicalEntities,
    result.clinical_entities,
    result.entities,
    result.keyFindings,
    result.key_findings,
    getNestedValue(result, ["extraction", "symptoms"]),
    getNestedValue(result, ["extracao", "sintomas"]),
    getNestedValue(result, ["clinical", "entities"]),
    getNestedValue(result, ["analysis", "entities"]),
  ];

  return candidates
    .flatMap((candidate) => flattenClinicalItem(candidate))
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim())
    .filter((item, index, list) => list.indexOf(item) === index)
    .slice(0, 10);
}

function flattenClinicalItem(value: JsonValue | undefined): string[] {
  if (typeof value === "string") return [value];
  if (typeof value === "number" || typeof value === "boolean") return [String(value)];
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenClinicalItem(item));
  }

  const label =
    value.label ??
    value.name ??
    value.nome ??
    value.value ??
    value.valor ??
    value.text ??
    value.descricao ??
    value.description;

  return typeof label === "string" ? [label] : [];
}

function getNestedValue(value: JsonValue | undefined, path: string[]): JsonValue | undefined {
  let current = value;

  for (const key of path) {
    if (!current || Array.isArray(current) || typeof current !== "object") {
      return undefined;
    }

    current = current[key];
  }

  return current;
}

function toNumber(value: JsonValue | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;

  const parsed = Number(value.replace("%", "").replace(",", ".").trim());
  return Number.isFinite(parsed) ? parsed : null;
}
