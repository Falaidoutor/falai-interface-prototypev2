import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Clock,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { MANCHESTER_META, type ManchesterLevel } from "@/lib/mock-patients";
import { getAnalyticsMetrics, type AnalyticsMetrics } from "@/lib/backend-api";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({
    meta: [
      { title: "Gestão & Analytics" },
      {
        name: "description",
        content:
          "Indicadores operacionais de triagem hospitalar, previsão de demanda e desempenho da IA classificatória.",
      },
    ],
  }),
  component: AnalyticsPage,
});

const mockMetrics = [
  {
    icon: Users,
    label: "Pacientes hoje",
    value: "248",
    delta: "+12%",
    up: true,
    sub: "vs ontem",
  },
  {
    icon: Clock,
    label: "Tempo médio de espera",
    value: "27 min",
    delta: "−38%",
    up: true,
    sub: "vs semana",
  },
  {
    icon: Sparkles,
    label: "Acurácia da IA",
    value: "92,4%",
    delta: "+1,8%",
    up: true,
    sub: "30 dias",
  },
  {
    icon: AlertTriangle,
    label: "Casos críticos",
    value: "14",
    delta: "+3",
    up: false,
    sub: "vs ontem",
  },
];

const mockRiskBars: { level: ManchesterLevel; count: number }[] = [
  { level: "emergency", count: 6 },
  { level: "very-urgent", count: 22 },
  { level: "urgent", count: 78 },
  { level: "standard", count: 96 },
  { level: "non-urgent", count: 46 },
];

const mockHourly = [
  4, 6, 5, 4, 3, 5, 8, 14, 22, 28, 31, 34, 30, 26, 22, 24, 27, 32, 29, 21, 16, 12, 9, 7,
];

// 16 points over the next 4 hours, every 15 minutes
const mockForecastDemand = [18, 21, 24, 28, 31, 34, 36, 38, 39, 40, 38, 36, 33, 30, 27, 25];
const mockStaffingCapacity = Array.from({ length: 16 }, () => 32);
const qualityPeriodLabels = {
  today: "Hoje (00h–agora)",
  yesterday: "Ontem (00h–24h)",
  last7d: "Últimos 7 dias",
  last30d: "Últimos 30 dias",
} as const;

function metric(
  icon: typeof Users,
  label: string,
  value: string,
  delta: number | null,
  sub: string,
  positiveIsUp: boolean,
) {
  const up = delta === null ? true : positiveIsUp ? delta >= 0 : delta <= 0;
  return { icon, label, value, delta: delta === null ? "—" : (delta >= 0 ? "+" : "−") + formatNumber(Math.abs(delta)) + "%", up, sub };
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value);
}

function formatMinutes(value: number | null) {
  return value === null ? "—" : formatNumber(value) + " min";
}

function formatPercent(value: number | null) {
  return value === null ? "—" : formatNumber(value) + "%";
}

function toManchesterLevel(level: string): ManchesterLevel {
  const levels: Record<string, ManchesterLevel> = {
    "ESI-1": "emergency",
    "ESI-2": "very-urgent",
    "ESI-3": "urgent",
    "ESI-4": "standard",
    "ESI-5": "non-urgent",
  };
  return levels[level] ?? "standard";
}

function AnalyticsPage() {
  const [dataMode, setDataMode] = useState<"mock" | "real">("mock");
  const [realData, setRealData] = useState<AnalyticsMetrics | null>(null);
  const [qualityPeriod, setQualityPeriod] = useState<AnalyticsMetrics["qualityPeriod"]>("today");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRealData = async () => {
    setLoading(true);
    setError(null);
    try {
      setRealData(await getAnalyticsMetrics({ data: { qualityPeriod } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar as métricas reais.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dataMode === "real" && (!realData || realData.qualityPeriod !== qualityPeriod)) {
      void loadRealData();
    }
  }, [dataMode, qualityPeriod]);

  const usingRealData = dataMode === "real" && realData?.qualityPeriod === qualityPeriod;
  const qualityPeriodLabel = usingRealData
    ? realData!.qualityPeriodLabel
    : qualityPeriodLabels[qualityPeriod];
  const metrics = useMemo(() => {
    if (!usingRealData) return mockMetrics;
    return [
      metric(Users, "Pacientes hoje", formatNumber(realData.patientsToday), realData.patientsTodayDelta, "vs ontem", true),
      metric(Clock, "Tempo médio de espera", formatMinutes(realData.averageWaitMinutes), realData.averageWaitDelta, "hoje vs ontem", false),
      metric(Sparkles, "Acurácia da IA", formatPercent(realData.aiAccuracy), realData.aiAccuracyDelta, qualityPeriodLabel, true),
      metric(AlertTriangle, "Casos críticos", formatNumber(realData.criticalCases), realData.criticalCasesDelta, "hoje vs ontem", false),
    ];
  }, [realData, usingRealData, qualityPeriodLabel]);
  const riskBars = usingRealData
    ? realData!.riskDistribution.map(({ level, count }) => ({ level: toManchesterLevel(level), count }))
    : mockRiskBars;
  const hourly = usingRealData ? realData!.hourlyVolume : mockHourly;
  const forecastDemand = usingRealData ? realData!.forecastDemand : mockForecastDemand;
  const staffingCapacity = usingRealData ? realData!.staffingCapacity : mockStaffingCapacity;
  const maxBar = Math.max(1, ...riskBars.map((r) => r.count));

  const agreementCards = usingRealData
    ? [
        { l: "Concordância total", v: formatPercent(realData!.agreement.total), c: "bg-emerald-500", d: null, up: true },
        { l: "Ajuste de 1 nível", v: formatPercent(realData!.agreement.oneLevel), c: "bg-amber-500", d: null, up: true },
        { l: "Reclassificação ampla", v: formatPercent(realData!.agreement.broad), c: "bg-rose-500", d: null, up: true },
      ]
    : [
        { l: "Concordância total", v: "82,1%", c: "bg-emerald-500", d: "+2,3%", up: true },
        { l: "Ajuste de 1 nível", v: "13,5%", c: "bg-amber-500", d: "−1,1%", up: true },
        { l: "Reclassificação ampla", v: "4,4%", c: "bg-rose-500", d: "−0,8%", up: true },
      ];

  return (
    <div className="p-6 md:p-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Gestão & Analytics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visão executiva do desempenho da triagem assistida por IA
        </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="inline-flex rounded-lg bg-muted p-1 text-sm text-muted-foreground" role="group" aria-label="Fonte dos dados">
            <button type="button" onClick={() => setDataMode("mock")} aria-pressed={dataMode === "mock"} className={`rounded-md px-3 py-1.5 font-medium transition-colors ${dataMode === "mock" ? "bg-background text-foreground shadow-sm" : "hover:text-foreground"}`}>
              Dados mockados
            </button>
            <button type="button" onClick={() => setDataMode("real")} aria-pressed={dataMode === "real"} className={`rounded-md px-3 py-1.5 font-medium transition-colors ${dataMode === "real" ? "bg-background text-foreground shadow-sm" : "hover:text-foreground"}`}>
              Dados reais
            </button>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {dataMode === "mock" ? "Dados prontos para demonstração" : realData ? `Atualizado às ${new Date(realData.generatedAt).toLocaleTimeString("pt-BR")}` : "Consultando o backend..."}
          </span>
        </div>
      </header>

      {dataMode === "real" && loading ? <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-primary" /> Carregando métricas reais...</div> : null}
      {dataMode === "real" && error ? <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-rose-700 dark:text-rose-300"><span className="flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {error}</span><button type="button" onClick={() => void loadRealData()} className="inline-flex items-center gap-1 font-semibold"><RefreshCw className="h-3.5 w-3.5" /> Tentar novamente</button></div> : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
        <div>
          <div className="text-xs font-semibold text-foreground">Faixa de análise da qualidade da IA</div>
          <div className="text-[11px] text-muted-foreground">Aplica-se à Acurácia da IA e à Concordância IA × Especialista.</div>
        </div>
        <select
          value={qualityPeriod}
          onChange={(event) => setQualityPeriod(event.target.value as AnalyticsMetrics["qualityPeriod"])}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
          aria-label="Faixa de análise da qualidade da IA"
        >
          <option value="today">Hoje (00h–agora)</option>
          <option value="yesterday">Ontem (00h–24h)</option>
          <option value="last7d">Últimos 7 dias</option>
          <option value="last30d">Últimos 30 dias</option>
        </select>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow duration-200 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <m.icon className="h-4.5 w-4.5" />
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  m.up
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                }`}
              >
                {m.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {m.delta}
              </span>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-foreground">{m.value}</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>{m.label}</span>
                <span className="text-[10px] text-muted-foreground/70">· {m.sub}</span>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Forecast widget */}
      <section className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Activity className="h-4 w-4 text-primary" />
              Previsão de Demanda — Próximas 4h
            </h2>
            <p className="text-xs text-muted-foreground">
              Modelo de série temporal vs. capacidade de plantão
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-medium">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" /> Demanda prevista
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-rose-500" /> Capacidade
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 font-semibold text-rose-600 dark:text-rose-400">
              <TrendingUp className="h-3 w-3" /> Pico previsto às 16h45
            </span>
          </div>
        </div>
        <ForecastChart demand={forecastDemand} capacity={staffingCapacity} />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Atendimentos por nível de risco
            </h2>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Hoje (00h → agora)
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Distribuição segundo Protocolo Manchester</p>
          <div className="mt-6 flex h-56 items-end gap-3">
            {riskBars.map((r) => {
              const h = (r.count / maxBar) * 100;
              const meta = MANCHESTER_META[r.level];
              return (
                <div key={r.level} className="flex flex-1 flex-col items-center gap-2">
                  <div className="text-xs font-semibold text-foreground">{r.count}</div>
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-md transition-all duration-500"
                      style={{
                        height: `${h}%`,
                        backgroundColor: meta.colorVar,
                      }}
                    />
                  </div>
                  <div className="text-center text-[10px] font-medium leading-tight text-muted-foreground">
                    {meta.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-3">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Volume de entrada por hora</h2>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Hoje · 00h → 23h
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Pacientes registrados em totem por hora</p>
          <LineChart values={hourly} />
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Concordância IA × Especialista</h2>
        <p className="text-xs text-muted-foreground">
          Comparativo entre classificação sugerida e validação clínica final · Faixa analisada: {qualityPeriodLabel}
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            {
              l: "Concordância total",
              v: usingRealData ? formatPercent(realData!.agreement.total) : "82,1%",
              c: "bg-emerald-500",
              d: "+2,3%",
              up: true,
            },
            {
              l: "Ajuste de 1 nível",
              v: usingRealData ? formatPercent(realData!.agreement.oneLevel) : "13,5%",
              c: "bg-amber-500",
              d: "−1,1%",
              up: true,
            },
            {
              l: "Reclassificação ampla",
              v: usingRealData ? formatPercent(realData!.agreement.broad) : "4,4%",
              c: "bg-rose-500",
              d: "−0,8%",
              up: true,
            },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${s.c}`} />
                  {s.l}
                </span>
                <span
                  className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${s.up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                >
                  {s.up ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                  {s.d}
                </span>
              </div>
              <div className="mt-2 text-xl font-bold text-foreground">{s.v}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function LineChart({ values }: { values: number[] }) {
  const w = 600;
  const h = 220;
  const padX = 24;
  const padY = 20;
  const max = Math.max(...values);
  const stepX = (w - padX * 2) / (values.length - 1);
  const points = values.map((v, i) => {
    const x = padX + i * stepX;
    const y = h - padY - (v / max) * (h - padY * 2);
    return [x, y] as const;
  });
  const path = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const area =
    `M${points[0][0]},${h - padY} ` +
    points.map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(1)}`).join(" ") +
    ` L${points[points.length - 1][0]},${h - padY} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 h-56 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="lineFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={padX}
          x2={w - padX}
          y1={h - padY - f * (h - padY * 2)}
          y2={h - padY - f * (h - padY * 2)}
          stroke="var(--border)"
          strokeDasharray="3 4"
        />
      ))}
      <path d={area} fill="url(#lineFill)" />
      <path
        d={path}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map(([x, y], i) =>
        i % 3 === 0 ? <circle key={i} cx={x} cy={y} r="3" fill="var(--primary)" /> : null,
      )}
      {[0, 6, 12, 18, 23].map((i) => (
        <text
          key={i}
          x={padX + i * stepX}
          y={h - 4}
          textAnchor="middle"
          fontSize="9"
          fill="var(--muted-foreground)"
        >
          {i.toString().padStart(2, "0")}h
        </text>
      ))}
    </svg>
  );
}

function ForecastChart({ demand, capacity }: { demand: number[]; capacity: number[] }) {
  const w = 800;
  const h = 240;
  const padX = 36;
  const padY = 24;
  const all = [...demand, ...capacity];
  const max = Math.max(...all) * 1.15;
  const stepX = (w - padX * 2) / (demand.length - 1);
  const toPt = (v: number, i: number) => {
    const x = padX + i * stepX;
    const y = h - padY - (v / max) * (h - padY * 2);
    return [x, y] as const;
  };
  const dPts = demand.map(toPt);
  const cPts = capacity.map(toPt);

  const smooth = (pts: readonly (readonly [number, number])[]) =>
    pts
      .map(([x, y], i) => {
        if (i === 0) return `M${x},${y}`;
        const [px, py] = pts[i - 1];
        const cx = (px + x) / 2;
        return `Q${px},${py} ${cx},${(py + y) / 2} T${x},${y}`;
      })
      .join(" ");

  const dPath = smooth(dPts);
  const cPath = cPts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const area =
    `M${dPts[0][0]},${h - padY} ` +
    dPts.map(([x, y]) => `L${x},${y}`).join(" ") +
    ` L${dPts[dPts.length - 1][0]},${h - padY} Z`;

  // labels every hour (every 4th point)
  const startHour = 13;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 h-64 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="forecastFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={padX}
          x2={w - padX}
          y1={h - padY - f * (h - padY * 2)}
          y2={h - padY - f * (h - padY * 2)}
          stroke="var(--border)"
          strokeDasharray="3 4"
        />
      ))}
      <path d={area} fill="url(#forecastFill)" />
      <path
        d={dPath}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={cPath}
        fill="none"
        stroke="var(--manchester-red)"
        strokeWidth="2"
        strokeDasharray="6 5"
        strokeLinecap="round"
      />
      {/* Overflow shading */}
      {dPts.map(([x, y], i) => {
        const [, cy] = cPts[i];
        if (y < cy) {
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3.5"
              fill="var(--manchester-red)"
              stroke="var(--card)"
              strokeWidth="1.5"
            />
          );
        }
        return null;
      })}
      {Array.from({ length: 5 }).map((_, i) => {
        const idx = i * 4;
        const x = padX + Math.min(idx, demand.length - 1) * stepX;
        const hour = startHour + i;
        return (
          <text
            key={i}
            x={x}
            y={h - 6}
            textAnchor="middle"
            fontSize="10"
            fill="var(--muted-foreground)"
          >
            {hour.toString().padStart(2, "0")}h00
          </text>
        );
      })}
    </svg>
  );
}
