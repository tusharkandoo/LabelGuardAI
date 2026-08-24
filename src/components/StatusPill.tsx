import { AlertTriangle, Check, HelpCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CheckStatus } from "@/lib/types";

const MAP: Record<CheckStatus, { label: string; className: string; Icon: typeof Check }> = {
  PASS: { label: "Pass", className: "bg-success/12 text-success border-success/30", Icon: Check },
  WARN: {
    label: "Warning",
    className: "bg-warning/15 text-warning-foreground border-warning/40",
    Icon: AlertTriangle,
  },
  REVIEW: {
    label: "Manual review",
    className: "bg-info/12 text-info border-info/30",
    Icon: HelpCircle,
  },
  FAIL: {
    label: "Violation",
    className: "bg-destructive/10 text-destructive border-destructive/30",
    Icon: X,
  },
};

export function StatusPill({ status, className }: { status: CheckStatus; className?: string }) {
  const { label, className: tone, Icon } = MAP[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        tone,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

export function VerdictPill({
  verdict,
  className,
}: {
  verdict: "COMPLIANT" | "POTENTIALLY_NON_COMPLIANT" | "NON_COMPLIANT";
  className?: string;
}) {
  const map = {
    COMPLIANT: { label: "Compliant", tone: "bg-success/12 text-success border-success/30" },
    POTENTIALLY_NON_COMPLIANT: {
      label: "Potentially non-compliant",
      tone: "bg-warning/15 text-warning-foreground border-warning/40",
    },
    NON_COMPLIANT: {
      label: "Non-compliant",
      tone: "bg-destructive/10 text-destructive border-destructive/30",
    },
  } as const;
  const v = map[verdict];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        v.tone,
        className,
      )}
    >
      {v.label}
    </span>
  );
}
