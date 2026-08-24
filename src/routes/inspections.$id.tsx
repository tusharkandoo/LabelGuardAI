import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { FileText, Info, MapPin, ShieldQuestion } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EvidenceViewer } from "@/components/EvidenceViewer";
import { StatusPill, VerdictPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { getInspection, upsertInspection } from "@/lib/store";
import { scoreOf, verdictOf } from "@/lib/rules";
import type { ComplianceCheck, Inspection, OfficerDecision } from "@/lib/types";

export const Route = createFileRoute("/inspections/$id")({
  head: () => ({
    meta: [
      { title: "Compliance Analysis — LabelGuard AI" },
      {
        name: "description",
        content:
          "Review extracted label declarations, rule-based compliance checks, highlighted evidence and officer verification for a packaged commodity inspection.",
      },
      { property: "og:title", content: "Compliance Analysis — LabelGuard AI" },
      {
        property: "og:description",
        content:
          "Evidence-linked Legal Metrology compliance findings awaiting officer verification.",
      },
    ],
  }),
  component: AnalysisPage,
});

const DECLARATION_FIELDS: [keyof Inspection["extracted"], string][] = [
  ["manufacturer", "Manufacturer / packer / importer"],
  ["address", "Address"],
  ["netQuantity", "Net quantity"],
  ["mrp", "Retail sale price (MRP)"],
  ["mfgDate", "Month & year of packing"],
  ["consumerCare", "Consumer care details"],
  ["countryOfOrigin", "Country of origin"],
  ["fssai", "FSSAI licence no."],
];

function AnalysisPage() {
  const { id } = useParams({ from: "/inspections/$id" });
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [activeField, setActiveField] = useState<string | undefined>();

  useEffect(() => {
    const found = getInspection(id);
    setInspection(found ?? null);
    const firstIssue = found?.checks.find((c) => c.status !== "PASS");
    setActiveField(firstIssue?.id ?? found?.checks[0]?.id);
  }, [id]);

  const activeCheck = useMemo(
    () => inspection?.checks.find((c) => c.id === activeField),
    [inspection, activeField],
  );

  if (!inspection) {
    return (
      <AppShell title="Inspection not found" subtitle="This record is not available on this device">
        <div className="panel p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Inspection <span className="font-mono">{id}</span> could not be located.
          </p>
          <Button asChild className="mt-4">
            <Link to="/inspections">Back to inspection history</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const passed = inspection.checks.filter((c) => c.status === "PASS").length;
  const violations = inspection.checks.filter((c) => c.status === "FAIL").length;
  const warnings = inspection.checks.filter((c) => c.status === "WARN").length;
  const reviews = inspection.checks.filter((c) => c.status === "REVIEW").length;

  function decide(checkId: string, decision: OfficerDecision) {
    const next: Inspection = {
      ...inspection!,
      checks: inspection!.checks.map((c) => (c.id === checkId ? { ...c, decision } : c)),
    };
    next.score = scoreOf(next.checks);
    next.verdict = verdictOf(next.checks, next.score);
    upsertInspection(next);
    setInspection(next);
  }

  return (
    <AppShell
      title={inspection.productName}
      subtitle={`${inspection.id} · ${new Date(inspection.createdAt).toLocaleString("en-IN")} · Officer ${inspection.officer}`}
      actions={
        <Button asChild size="sm" variant="outline">
          <Link to="/reports/$id" params={{ id: inspection.id }}>
            <FileText className="mr-1.5 h-4 w-4" />
            Report
          </Link>
        </Button>
      }
    >
      {/* GPS GeoTag Banner */}
      {inspection.location && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-border bg-card px-3.5 py-2 text-xs text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <span>
            <strong className="text-foreground font-medium">GPS On-Site Geotag:</strong> Lat:{" "}
            {inspection.location.latitude}°, Lon: {inspection.location.longitude}° (Accuracy: ±
            {inspection.location.accuracy}m)
          </span>
          <span className="ml-auto font-mono text-[11px]">
            {new Date(inspection.location.timestamp).toLocaleTimeString("en-IN")}
          </span>
        </div>
      )}

      {inspection.extracted.note && (
        <p className="mb-4 flex items-start gap-2 rounded-md border border-info/30 bg-info/10 px-3 py-2 text-xs text-info">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {inspection.extracted.note}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-5">
        {/* Evidence viewer */}
        <section className="xl:col-span-2">
          <div className="panel p-4">
            <div className="flex items-center justify-between">
              <p className="label-caps">Evidence viewer</p>
              <span className="text-[11px] text-muted-foreground">
                {inspection.extracted.source === "ai-vision" ? "AI vision OCR" : "Demo extraction"}
              </span>
            </div>
            <div className="mt-3">
              <EvidenceViewer
                image={inspection.images[0]}
                boxes={inspection.extracted.boxes}
                activeField={activeField}
                statusOf={(field) => inspection.checks.find((c) => c.id === field)?.status}
                onSelect={setActiveField}
              />
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              Bounding boxes mark the label regions linked to each declaration. Select a marker or a
              check to inspect the underlying evidence.
            </p>
          </div>

          <div className="panel mt-4 p-5">
            <p className="label-caps">Compliance score</p>
            <div className="mt-2 flex items-end gap-3">
              <p className="text-5xl font-semibold tabular-nums">{inspection.score}</p>
              <span className="pb-1.5 text-sm text-muted-foreground">/ 100</span>
              <VerdictPill verdict={inspection.verdict} className="mb-2 ml-auto" />
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${inspection.score}%` }}
              />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Metric label="Checks passed" value={passed} />
              <Metric label="Violations" value={violations} tone="text-destructive" />
              <Metric label="Warnings" value={warnings} tone="text-warning-foreground" />
              <Metric label="Manual review" value={reviews} tone="text-info" />
            </dl>
            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
              AI-assisted preliminary assessment only. The score is an internal triage indicator and
              carries no statutory effect; prosecution decisions rest with the enforcement officer.
            </p>
          </div>
        </section>

        {/* Extracted declarations + checks */}
        <section className="xl:col-span-3">
          <div className="panel p-5">
            <p className="label-caps">Extracted declarations</p>
            <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {DECLARATION_FIELDS.map(([key, label]) => {
                const value = inspection.extracted[key] as string | undefined;
                return (
                  <div key={String(key)} className="min-w-0">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {label}
                    </dt>
                    <dd
                      className={
                        value
                          ? "mt-0.5 text-sm break-words"
                          : "mt-0.5 text-sm italic text-destructive"
                      }
                    >
                      {value ?? "Not detected"}
                    </dd>
                  </div>
                );
              })}
            </dl>
            {inspection.extracted.rawText && (
              <details className="mt-4">
                <summary className="cursor-pointer text-xs font-medium text-primary">
                  View raw OCR text
                </summary>
                <p className="mt-2 rounded-md bg-surface p-3 font-mono text-[11px] leading-relaxed break-words">
                  {inspection.extracted.rawText}
                </p>
              </details>
            )}
          </div>

          <div className="panel mt-4 overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <p className="text-sm font-semibold">Compliance checks</p>
              <p className="text-xs text-muted-foreground">
                Deterministic rule engine · Legal Metrology (Packaged Commodities) Rules, 2011
              </p>
            </div>
            <ul>
              {inspection.checks.map((check) => (
                <li key={check.id}>
                  <button
                    onClick={() => setActiveField(check.id)}
                    className={`flex w-full flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border px-5 py-3 text-left transition-colors hover:bg-surface ${
                      activeField === check.id ? "bg-surface" : ""
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{check.requirement}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {check.ruleReference}
                      </span>
                    </span>
                    <StatusPill status={check.status} />
                    <span className="w-14 text-right text-xs tabular-nums text-muted-foreground">
                      {Math.round(check.confidence * 100)}%
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {activeCheck && <ViolationPanel check={activeCheck} onDecide={decide} />}
        </section>
      </div>
    </AppShell>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={`text-xl font-semibold tabular-nums ${tone ?? ""}`}>{value}</dd>
    </div>
  );
}

function ViolationPanel({
  check,
  onDecide,
}: {
  check: ComplianceCheck;
  onDecide: (id: string, decision: OfficerDecision) => void;
}) {
  const decisionLabel: Record<OfficerDecision, string> = {
    PENDING: "Awaiting officer decision",
    CONFIRMED: "Confirmed by officer",
    FALSE_POSITIVE: "Marked false positive",
    MANUAL_REVIEW: "Referred for manual verification",
  };

  return (
    <div className="panel mt-4 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
          <ShieldQuestion className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="label-caps">
            {check.status === "PASS" ? "Check detail" : "Potential violation"}
          </p>
          <p className="text-sm font-semibold">{check.requirement}</p>
        </div>
        <StatusPill status={check.status} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="AI assessment">
          {check.status === "PASS"
            ? "Declaration detected and validated"
            : "Possible non-compliance detected"}{" "}
          · confidence {Math.round(check.confidence * 100)}%
        </Field>
        <Field label="Legal rule">{check.ruleReference}</Field>
        <Field label="Extracted value">{check.extractedValue ?? "Not detected"}</Field>
        <Field label="Evidence">{check.evidence}</Field>
      </div>

      <div className="mt-4 rounded-md border border-border bg-surface p-3 text-sm leading-relaxed">
        {check.explanation}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => onDecide(check.id, "CONFIRMED")}>
          Confirm violation
        </Button>
        <Button size="sm" variant="outline" onClick={() => onDecide(check.id, "FALSE_POSITIVE")}>
          False positive
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onDecide(check.id, "MANUAL_REVIEW")}>
          Needs manual review
        </Button>
        <span className="text-xs text-muted-foreground sm:ml-auto">
          {decisionLabel[check.decision]}
        </span>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm break-words">{children}</p>
    </div>
  );
}
