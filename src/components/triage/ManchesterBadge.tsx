import { MANCHESTER_META, type ManchesterLevel } from "@/lib/mock-patients";
import { cn } from "@/lib/utils";

interface Props {
  level: ManchesterLevel;
  className?: string;
  variant?: "solid" | "soft" | "dot";
}

export function ManchesterBadge({ level, className, variant = "solid" }: Props) {
  const meta = MANCHESTER_META[level];

  if (variant === "dot") {
    return (
      <span className={cn("inline-flex items-center gap-2 text-sm", className)}>
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.colorVar }} />
        <span className="font-medium text-foreground">{meta.label}</span>
      </span>
    );
  }

  if (variant === "soft") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-xs font-semibold",
          className,
        )}
        style={{
          backgroundColor: `color-mix(in oklab, ${meta.colorVar} 14%, transparent)`,
          color: meta.colorVar,
        }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.colorVar }} />
        {meta.label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-xs font-semibold text-white shadow-sm",
        className,
      )}
      style={{ backgroundColor: meta.colorVar }}
    >
      {meta.label}
      <span className="opacity-80 font-normal">· {meta.waitMin}min</span>
    </span>
  );
}
