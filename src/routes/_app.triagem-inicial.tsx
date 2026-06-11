import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Contrast,
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
type VoiceSupport = {
  supported: boolean;
  reason?: string;
};

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
  onnomatch?: (() => void) | null;
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

const DEFAULT_LANG: Lang = "PT";

function InitialTriagePage() {
  const [cpf, setCpf] = useState("");
  const [highContrast, setHighContrast] = useState(false);
  const [largerText, setLargerText] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", text: GREETINGS[DEFAULT_LANG] },
  ]);
  const [input, setInput] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voice, setVoice] = useState<VoiceState>("idle");
  const [auth, setAuth] = useState<AuthResponse | null>(null);
  const [loadingCpf, setLoadingCpf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTriage, setCreatedTriage] = useState<PatientTriage | null>(null);
  const [voiceSupport, setVoiceSupport] = useState<VoiceSupport>({ supported: true });
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
        : GREETINGS[DEFAULT_LANG];
      return current[0].text === text ? current : [{ role: "ai", text }];
    });
  }, [auth?.patientName, firstName]);

  useEffect(() => {
    setVoiceSupport(getVoiceSupport());

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

  const startVoice = async () => {
    if (typeof window === "undefined" || isBlocked) return;

    const support = getVoiceSupport();
    setVoiceSupport(support);

    if (!support.supported) {
      setError(support.reason ?? getUnsupportedVoiceMessage());
      return;
    }

    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (!SpeechRecognition) {
      setError(getUnsupportedVoiceMessage());
      return;
    }

    const mobileSafari = isMobileSafari();
    if (!mobileSafari) {
      const microphoneError = await ensureMicrophoneAccess();
      if (microphoneError) {
        setError(microphoneError);
        return;
      }
    }

    recognitionRef.current?.abort();
    setError(null);

    const recognition = new SpeechRecognition();
    let finalTranscript = "";
    let receivedSpeech = false;

    recognition.lang = getSpeechLanguage(DEFAULT_LANG);
    recognition.interimResults = !mobileSafari;
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
      if (transcript) {
        receivedSpeech = true;
        setInput(transcript);
      }
    };

    recognition.onerror = (event) => {
      recognitionRef.current = null;
      setVoice("idle");
      setError(`Não foi possível capturar o áudio. ${getSpeechErrorMessage(event.error)}`);
    };

    recognition.onnomatch = () => {
      setError("Não consegui entender o áudio. Fale mais perto do microfone ou digite os sintomas.");
    };

    recognition.onspeechend = () => {
      setVoice("processing");
      recognition.stop();
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setVoice("idle");
      if (finalTranscript.trim()) {
        setInput(finalTranscript.trim());
        return;
      }

      if (!receivedSpeech) {
        setError("Não detectei fala. Tente novamente ou digite os sintomas.");
      }
    };

    setVoice("listening");
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setVoice("idle");
      setError("Não foi possível iniciar o ditado por voz. Tente novamente ou digite os sintomas.");
    }
  };

  return (
    <div
      className={cn(
        "flex min-h-[calc(100vh-3.5rem)] flex-col bg-gradient-to-b from-background to-accent/40",
        highContrast && "bg-background text-foreground",
        largerText && "text-[1.08em]",
      )}
    >
      <div
        className={cn(
          "border-b border-border bg-card/80 backdrop-blur",
          highContrast && "border-foreground bg-background",
        )}
      >
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-2.5">
          <span
            className={cn(
              "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
              highContrast && "text-foreground",
              largerText && "text-xs",
            )}
          >
            Acessibilidade
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <AccessButton
              active={highContrast}
              onClick={() => setHighContrast((value) => !value)}
              icon={<Contrast className="h-3.5 w-3.5" />}
              label="Alto contraste"
              large={largerText}
              pressedLabel={highContrast ? "Alto contraste ativado" : "Ativar alto contraste"}
            />
            <AccessButton
              active={largerText}
              onClick={() => setLargerText((value) => !value)}
              icon={<Type className="h-3.5 w-3.5" />}
              label="Texto maior"
              large={largerText}
              pressedLabel={largerText ? "Texto maior ativado" : "Ativar texto maior"}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-3xl">
          <div className="mb-6 text-center">
            <h1
              className={cn(
                "text-3xl font-bold text-foreground md:text-4xl",
                largerText && "text-4xl md:text-5xl",
              )}
            >
              Triagem Inicial
            </h1>
            <p
              className={cn(
                "mt-2 text-lg text-muted-foreground",
                highContrast && "text-foreground",
                largerText && "text-xl",
              )}
            >
              Informe o paciente e descreva os sintomas para registrar a triagem.
            </p>
          </div>

          <div
            className={cn(
              "mb-4 rounded-xl border border-border bg-card p-4 shadow-sm",
              highContrast && "border-2 border-foreground bg-background shadow-none",
            )}
          >
            <label
              className={cn(
                "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                highContrast && "text-foreground",
                largerText && "text-sm",
              )}
            >
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
                className={cn(
                  "h-11 w-full rounded-md border border-input bg-background px-3 pr-12 text-sm font-medium outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring",
                  highContrast && "border-2 border-foreground text-foreground focus:border-foreground",
                  largerText && "h-12 text-base",
                )}
              />
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "absolute right-1 top-0 h-11 w-11",
                  highContrast && "text-foreground hover:bg-foreground hover:text-background",
                  largerText && "h-12 w-12",
                )}
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
              <p
                className={cn(
                  "mt-2 text-sm text-muted-foreground",
                  highContrast && "text-foreground",
                  largerText && "text-base",
                )}
              >
                Paciente: <span className="font-medium text-foreground">{auth.patientName}</span>
              </p>
            )}
            {error && (
              <p
                className={cn(
                  "mt-2 text-sm font-medium text-destructive",
                  highContrast && "font-bold text-foreground",
                  largerText && "text-base",
                )}
              >
                {error}
              </p>
            )}
          </div>

          <div
            className={cn(
              "overflow-hidden rounded-2xl border-2 border-border bg-card shadow-lg",
              highContrast && "border-foreground bg-background shadow-none",
            )}
          >
            <div
              className={cn(
                "flex h-[420px] flex-col gap-4 overflow-y-auto p-6",
                largerText && "h-[460px]",
              )}
            >
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={cn(
                      "max-w-[85%] whitespace-pre-line rounded-2xl px-5 py-4 text-lg leading-relaxed",
                      largerText && "max-w-[92%] text-xl leading-8",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-accent text-foreground",
                      highContrast &&
                        (message.role === "user"
                          ? "border-2 border-foreground bg-foreground text-background"
                          : "border-2 border-foreground bg-background text-foreground"),
                    )}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
              {isSubmitting && (
                <div className="flex justify-start">
                  <div
                    className={cn(
                      "flex items-center gap-2 rounded-2xl bg-accent px-5 py-4 text-muted-foreground",
                      highContrast && "border-2 border-foreground bg-background text-foreground",
                      largerText && "text-lg",
                    )}
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-base">Registrando triagem...</span>
                  </div>
                </div>
              )}
            </div>

            <div
              className={cn(
                "border-t border-border bg-background/60 p-4",
                highContrast && "border-foreground bg-background",
              )}
            >
              {!isBlocked ? (
                voice === "idle" ? (
                  <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end">
                    <Textarea
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      placeholder="Digite seus sintomas..."
                      className={cn(
                        "min-h-[72px] flex-1 resize-none border-2 text-lg focus:ring-2 focus:ring-ring",
                        highContrast && "border-foreground text-foreground focus:border-foreground",
                        largerText && "min-h-24 text-xl leading-8",
                      )}
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
                      className={cn(
                        "h-[72px] w-full shrink-0 border-2 transition-colors duration-200 hover:bg-primary/10 sm:w-[72px]",
                        highContrast && "border-foreground text-foreground hover:bg-foreground hover:text-background",
                        largerText && "h-20 sm:h-24 sm:w-24",
                      )}
                      aria-label="Ditado por voz"
                      onClick={() => void startVoice()}
                      title={voiceSupport.supported ? "Ditado por voz" : voiceSupport.reason}
                    >
                      <Mic className="!h-7 !w-7 text-primary" />
                    </Button>
                    <Button
                      size="lg"
                      className={cn(
                        "h-[72px] gap-2 px-6 text-lg",
                        highContrast && "border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground",
                        largerText && "h-20 px-8 text-xl sm:h-24",
                      )}
                      onClick={() => void submitTriage()}
                      disabled={!canSubmit}
                    >
                      <Send className="h-5 w-5" />
                      Enviar
                    </Button>
                  </div>
                ) : (
                  <VoicePanel
                    state={voice}
                    onCancel={stopVoice}
                    highContrast={highContrast}
                    largerText={largerText}
                  />
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
          <div className="my-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-6 text-center">
            <div className="text-sm font-medium text-muted-foreground">Sua senha</div>
            <div className="mx-auto mt-1 max-w-full break-all text-4xl font-bold leading-tight tracking-tight text-primary sm:text-5xl">
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

function getSpeechRecognitionConstructor() {
  if (typeof window === "undefined") return null;

  const speechWindow = window as SpeechRecognitionWindow;
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function getVoiceSupport(): VoiceSupport {
  if (typeof window === "undefined") {
    return { supported: false, reason: getUnsupportedVoiceMessage() };
  }

  if (!window.isSecureContext) {
    return {
      supported: false,
      reason: "O ditado por voz precisa de HTTPS ou localhost para acessar o microfone.",
    };
  }

  if (!getSpeechRecognitionConstructor()) {
    return {
      supported: false,
      reason: getUnsupportedVoiceMessage(),
    };
  }

  return { supported: true };
}

function getUnsupportedVoiceMessage() {
  return "Este navegador nao oferece reconhecimento de fala nativo. Use Chrome, Edge ou Safari recente, ou digite os sintomas no campo de texto.";
}

async function ensureMicrophoneAccess() {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return "Este navegador nao permite validar o microfone nesta pagina. Digite os sintomas ou tente outro navegador.";
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return null;
  } catch (error) {
    const name = error instanceof DOMException ? error.name : "";

    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      return "Permita o uso do microfone no navegador e tente novamente.";
    }

    if (name === "NotFoundError" || name === "DevicesNotFoundError") {
      return "Nenhum microfone foi encontrado neste dispositivo.";
    }

    if (name === "NotReadableError" || name === "TrackStartError") {
      return "O microfone esta em uso por outro aplicativo ou indisponivel.";
    }

    return "Nao foi possivel acessar o microfone. Tente novamente ou digite os sintomas.";
  }
}

function isMobileSafari() {
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent;
  const isAppleMobile = /iPad|iPhone|iPod/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent);
  return isAppleMobile && isSafari;
}

function getSpeechErrorMessage(error: string) {
  const messages: Record<string, string> = {
    "not-allowed": "Permita o uso do microfone para ditar os sintomas.",
    "no-speech": "Nenhuma fala foi detectada. Tente novamente falando mais perto do microfone.",
    "audio-capture": "Nenhum microfone foi encontrado ou ele está indisponível.",
    aborted: "O ditado foi interrompido. Tente novamente quando estiver pronto.",
    "service-not-allowed":
      "O navegador bloqueou o serviço de reconhecimento de fala. Verifique permissões do site.",
    network: "O serviço de reconhecimento de fala não respondeu.",
  };

  return messages[error] ?? "Tente novamente ou digite os sintomas manualmente.";
}

function AccessButton({
  active,
  onClick,
  icon,
  label,
  large,
  pressedLabel,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  large: boolean;
  pressedLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={pressedLabel}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-background text-foreground hover:border-primary hover:bg-accent",
        large && "px-4 py-2 text-sm",
      )}
    >
      {icon} {label}
    </button>
  );
}

function VoicePanel({
  state,
  onCancel,
  highContrast,
  largerText,
}: {
  state: "listening" | "processing";
  onCancel: () => void;
  highContrast: boolean;
  largerText: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[72px] items-center gap-4 rounded-xl border-2 border-primary/40 bg-primary/5 px-5 py-3",
        highContrast && "border-foreground bg-background text-foreground",
        largerText && "min-h-24",
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground",
          highContrast && "bg-foreground text-background",
          largerText && "h-12 w-12",
        )}
      >
        <Mic className="h-5 w-5" />
      </div>
      <div className="flex-1">
        {state === "listening" ? (
          <>
            <div className={cn("text-sm font-semibold text-foreground", largerText && "text-lg")}>
              Escutando...
            </div>
            <VoiceWave />
          </>
        ) : (
          <>
            <div className={cn("text-sm font-semibold text-foreground", largerText && "text-lg")}>
              Processando NLP...
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-primary/15">
                <div
                  className={cn(
                    "h-full w-1/2 animate-pulse rounded-full bg-primary",
                    highContrast && "bg-foreground",
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-xs font-medium text-muted-foreground",
                  highContrast && "text-foreground",
                  largerText && "text-sm",
                )}
              >
                Extraindo sintomas
              </span>
            </div>
          </>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onCancel}
        aria-label="Cancelar"
        className={cn(
          highContrast && "text-foreground hover:bg-foreground hover:text-background",
          largerText && "h-12 w-12",
        )}
      >
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
