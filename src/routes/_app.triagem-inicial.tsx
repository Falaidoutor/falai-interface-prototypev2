import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Contrast,
  Languages,
  Loader2,
  Mic,
  Search,
  Send,
  Type,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  authenticatePatient,
  createPatientTriageOnBackend,
  type AuthResponse,
  type PatientTriage,
} from "@/lib/backend-api";
import { readPatientSession, storePatientSession } from "@/lib/patient-session";
import { formatCpf, normalizeCpf, readStoredCpf } from "@/lib/patient-triages";

export const Route = createFileRoute("/_app/triagem-inicial")({
  head: () => ({
    meta: [
      { title: "Triagem Inicial - FalAI Doutor" },
      {
        name: "description",
        content:
          "Interface de coleta de sintomas via IA conversacional para autoatendimento hospitalar.",
      },
    ],
  }),
  component: InitialTriagePage,
});

type Msg = { role: "ai" | "user"; text: string };
type Lang = "PT" | "EN" | "ES";
type VoiceState = "idle" | "listening" | "processing";

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onspeechend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionResultEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: { transcript: string } | undefined;
    };
  };
};

type SpeechRecognitionErrorEventLike = {
  error: string;
};

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const GREETINGS: Record<Lang, string> = {
  PT: "Olá. Descreva seus sintomas para iniciar uma nova triagem.",
  EN: "Hello. Describe your symptoms to start a new triage.",
  ES: "Hola. Describa sus síntomas para iniciar una nueva triaje.",
};

function InitialTriagePage() {
  const navigate = useNavigate();
  const [cpf, setCpf] = useState("");
  const [lang, setLang] = useState<Lang>("PT");
  const [highContrast, setHighContrast] = useState(false);
  const [largerText, setLargerText] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{ role: "ai", text: GREETINGS.PT }]);
  const [input, setInput] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voice, setVoice] = useState<VoiceState>("idle");
  const [auth, setAuth] = useState<AuthResponse | null>(null);
  const [loadingCpf, setLoadingCpf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTriage, setCreatedTriage] = useState<PatientTriage | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const normalizedCpf = useMemo(() => normalizeCpf(cpf).slice(0, 11), [cpf]);
  const canSearchCpf = normalizedCpf.length >= 1 && normalizedCpf.length <= 11;
  const firstName = auth?.patientName?.split(" ")[0] || "Paciente";
  const canSubmit = auth?.authenticated === true && !!input.trim() && !isSubmitting && !isBlocked;

  useEffect(() => {
    const session = readPatientSession();
    if (session) {
      setCpf(session.cpf);
      setAuth({
        authenticated: true,
        patientId: session.patientId,
        patientName: session.patientName,
        cpf: session.cpf,
      });
      setMessages([
        {
          role: "ai",
          text: `Olá, ${session.patientName?.split(" ")[0] || "Paciente"}! Descreva seus sintomas para iniciar uma nova triagem.`,
        },
      ]);
      return;
    }

    setCpf(readStoredCpf());
  }, []);

  useEffect(() => {
    setMessages((current) => {
      if (current.length !== 1 || current[0].role !== "ai") return current;
      const text = auth?.patientName
        ? `Olá, ${firstName}! Descreva seus sintomas para iniciar uma nova triagem.`
        : GREETINGS[lang];
      return current[0].text === text ? current : [{ role: "ai", text }];
    });
  }, [auth?.patientName, firstName, lang]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  const loadPatient = async () => {
    if (!canSearchCpf || loadingCpf) return;

    setLoadingCpf(true);
    setError(null);
    setAuth(null);
    try {
      const result = await authenticatePatient({ data: { cpf: normalizedCpf } });
      setAuth(result);
      if (!result.authenticated) {
        setError("CPF não localizado na base de pacientes.");
        return;
      }
      storePatientSession(result, normalizedCpf);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível validar o CPF.");
    } finally {
      setLoadingCpf(false);
    }
  };

  const submitTriage = async (text?: string) => {
    const symptoms = (text ?? input).trim();
    if (!symptoms || isSubmitting || isBlocked) return;

    if (!auth?.authenticated) {
      setError("Carregue o paciente pelo CPF antes de enviar a triagem.");
      return;
    }

    setMessages((current) => [...current, { role: "user", text: symptoms }]);
    setInput("");
    setIsSubmitting(true);
    setError(null);

    try {
      const triage = await createPatientTriageOnBackend({
        data: {
          cpf: normalizeCpf(auth.cpf ?? normalizedCpf),
          patientId: auth.patientId,
          symptoms,
        },
      });
      setCreatedTriage(triage);
      setIsBlocked(true);
      setMessages((current) => [
        ...current,
        {
          role: "ai",
          text: `Triagem registrada com sucesso.\n\nSenha da fila: ${triage.queueTicket}\n\nEla aparecerá como pendente até a análise da IA e a confirmação do profissional de saúde.`,
        },
      ]);
    } catch (err) {
      setMessages((current) => [
        ...current,
        {
          role: "ai",
          text: "Desculpe, não foi possível registrar a triagem. Tente novamente mais tarde.",
        },
      ]);
      setError(err instanceof Error ? err.message : "Não foi possível registrar a triagem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setVoice("idle");
  };

  const startVoice = () => {
    if (typeof window === "undefined" || isBlocked) return;

    const speechWindow = window as SpeechRecognitionWindow;
    const SpeechRecognition =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Ditado por voz não está disponível neste navegador. Digite os sintomas no campo de texto.",
      );
      return;
    }

    recognitionRef.current?.abort();
    setError(null);

    const recognition = new SpeechRecognition();
    let finalTranscript = "";

    recognition.lang = getSpeechLanguage(lang);
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      let interimTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index]?.[0]?.transcript ?? "";
        if (event.results[index]?.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const transcript = (finalTranscript || interimTranscript).trim();
      if (transcript) setInput(transcript);
    };

    recognition.onerror = (event) => {
      recognitionRef.current = null;
      setVoice("idle");
      setError(`Não foi possível capturar o áudio. ${getSpeechErrorMessage(event.error)}`);
    };

    recognition.onspeechend = () => {
      setVoice("processing");
      recognition.stop();
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setVoice("idle");
      if (finalTranscript.trim()) setInput(finalTranscript.trim());
    };

    setVoice("listening");
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setVoice("idle");
      setError("Não foi possível iniciar o ditado por voz. Tente novamente.");
    }
  };

  return (
    <div
      className={cn(
        "flex min-h-[calc(100vh-3.5rem)] flex-col bg-gradient-to-b from-background to-accent/40",
        highContrast && "contrast-125 saturate-150",
        largerText && "text-[1.08em]",
      )}
    >
      <div className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Acessibilidade
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <AccessButton
              active={highContrast}
              onClick={() => setHighContrast((value) => !value)}
              icon={<Contrast className="h-3.5 w-3.5" />}
              label="Alto contraste"
            />
            <AccessButton
              active={largerText}
              onClick={() => setLargerText((value) => !value)}
              icon={<Type className="h-3.5 w-3.5" />}
              label="Texto maior"
            />
            <div className="flex items-center gap-1 rounded-md border border-border bg-background p-0.5">
              <Languages className="ml-1.5 h-3.5 w-3.5 text-muted-foreground" />
              {(["PT", "EN", "ES"] as Lang[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setLang(item)}
                  className={cn(
                    "rounded px-2 py-1 text-xs font-medium transition-colors duration-200",
                    lang === item
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-3xl">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">Triagem Inicial</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Informe o paciente e descreva os sintomas para registrar a triagem.
            </p>
          </div>

          <div className="mb-4 rounded-xl border border-border bg-card p-4 shadow-sm">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              CPF do paciente
            </label>
            <div className="relative mt-2">
              <input
                value={formatCpf(cpf)}
                onChange={(event) => {
                  setCpf(normalizeCpf(event.target.value).slice(0, 11));
                  setAuth(null);
                  setError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void loadPatient();
                  }
                }}
                placeholder="000.000.000-00"
                inputMode="numeric"
                maxLength={14}
                className="h-11 w-full rounded-md border border-input bg-background px-3 pr-12 text-sm font-medium outline-none transition-colors focus:border-primary"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-0 h-11 w-11"
                disabled={!canSearchCpf || loadingCpf || isBlocked}
                onClick={() => void loadPatient()}
                aria-label="Carregar paciente"
              >
                {loadingCpf ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            {auth?.patientName && (
              <p className="mt-2 text-sm text-muted-foreground">
                Paciente: <span className="font-medium text-foreground">{auth.patientName}</span>
              </p>
            )}
            {error && <p className="mt-2 text-sm font-medium text-destructive">{error}</p>}
          </div>

          <div className="overflow-hidden rounded-2xl border-2 border-border bg-card shadow-lg">
            <div className="flex h-[420px] flex-col gap-4 overflow-y-auto p-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] whitespace-pre-line rounded-2xl px-5 py-4 text-lg leading-relaxed ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-accent text-foreground"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
              {isSubmitting && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl bg-accent px-5 py-4 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-base">Registrando triagem...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border bg-background/60 p-4">
              {!isBlocked ? (
                voice === "idle" ? (
                  <div className="flex items-end gap-3">
                    <Textarea
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      placeholder="Digite seus sintomas..."
                      className="min-h-[72px] flex-1 resize-none border-2 text-lg"
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          void submitTriage();
                        }
                      }}
                    />
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-[72px] w-[72px] shrink-0 border-2 transition-colors duration-200 hover:bg-primary/10"
                      aria-label="Ditado por voz"
                      onClick={startVoice}
                    >
                      <Mic className="!h-7 !w-7 text-primary" />
                    </Button>
                    <Button
                      size="lg"
                      className="h-[72px] gap-2 px-6 text-lg"
                      onClick={() => void submitTriage()}
                      disabled={!canSubmit}
                    >
                      <Send className="h-5 w-5" />
                      Enviar
                    </Button>
                  </div>
                ) : (
                  <VoicePanel state={voice} onCancel={stopVoice} />
                )
              ) : (
                <div className="flex justify-end">
                  <Button asChild>
                    <Link to="/totem">Ver minhas triagens</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!createdTriage} onOpenChange={(open) => !open && setCreatedTriage(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <DialogTitle className="text-2xl">Triagem registrada</DialogTitle>
            <DialogDescription className="text-base">
              Sua triagem entrou na fila de processamento. Acompanhe o status em Minhas Triagens.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 py-6 text-center">
            <div className="text-sm font-medium text-muted-foreground">Sua senha</div>
            <div className="mt-1 text-5xl font-bold tracking-tight text-primary">
              {createdTriage?.queueTicket}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" asChild>
              <Link to="/totem">Ver minhas triagens</Link>
            </Button>
            <Button
              onClick={() => {
                setCreatedTriage(null);
                void navigate({ to: "/totem" });
              }}
            >
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getSpeechLanguage(lang: Lang) {
  const languages: Record<Lang, string> = {
    PT: "pt-BR",
    EN: "en-US",
    ES: "es-ES",
  };

  return languages[lang];
}

function getSpeechErrorMessage(error: string) {
  const messages: Record<string, string> = {
    "not-allowed": "Permita o uso do microfone para ditar os sintomas.",
    "no-speech": "Nenhuma fala foi detectada. Tente novamente falando mais perto do microfone.",
    "audio-capture": "Nenhum microfone foi encontrado ou ele está indisponível.",
    network: "O serviço de reconhecimento de fala não respondeu.",
  };

  return messages[error] ?? "Tente novamente ou digite os sintomas manualmente.";
}

function AccessButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors duration-200",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:text-foreground",
      )}
    >
      {icon} {label}
    </button>
  );
}

function VoicePanel({
  state,
  onCancel,
}: {
  state: "listening" | "processing";
  onCancel: () => void;
}) {
  return (
    <div className="flex min-h-[72px] items-center gap-4 rounded-xl border-2 border-primary/40 bg-primary/5 px-5 py-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Mic className="h-5 w-5" />
      </div>
      <div className="flex-1">
        {state === "listening" ? (
          <>
            <div className="text-sm font-semibold text-foreground">Escutando...</div>
            <VoiceWave />
          </>
        ) : (
          <>
            <div className="text-sm font-semibold text-foreground">Processando NLP...</div>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-primary/15">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Extraindo sintomas</span>
            </div>
          </>
        )}
      </div>
      <Button variant="ghost" size="icon" onClick={onCancel} aria-label="Cancelar">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

function VoiceWave() {
  const bars = Array.from({ length: 28 });
  return (
    <div className="mt-2 flex h-7 items-end gap-[3px]">
      {bars.map((_, index) => (
        <span
          key={index}
          className="w-[3px] rounded-full bg-primary"
          style={{
            animation: `voiceBar 900ms ease-in-out ${index * 60}ms infinite alternate`,
            height: `${20 + ((index * 13) % 70)}%`,
          }}
        />
      ))}
      <style>{`
        @keyframes voiceBar {
          0% { transform: scaleY(0.35); opacity: 0.55; }
          100% { transform: scaleY(1.15); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
