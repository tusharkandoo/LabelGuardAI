import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileText, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { VerdictPill } from "@/components/StatusPill";
import { loadInspections } from "@/lib/store";
import type { Inspection } from "@/lib/types";

export const Route = createFileRoute("/products/$slug")({
  head: ({ params }) => {
    const name = decodeURIComponent(params.slug);
    const title = `${name} — Compliance History | LabelGuard AI`;
    const description = `All Legal Metrology inspections recorded for ${name}: compliance scores, recurring violations and officer-verified reports.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: ProductHistoryPage,
});

function ProductHistoryPage() {
  const { slug } = Route.useParams();
  const productName = decodeURIComponent(slug);
  const [all, setAll] = useState<Inspection[]>([]);

  useEffect(() => {
    const sync = () => setAll(loadInspections());
    sync();
    window.addEventListener("labelguard:updated", sync);
    return () => window.removeEventListener("labelguard:updated", sync);
  }, []);

  const rows = useMemo(
    () =>
      all
        .filter((i) => i.productName.toLowerCase() === productName.toLowerCase())
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [all, productName],
  );

  const avgScore = rows.length
    ? Math.round(rows.reduce((sum, i) => sum + i.score, 0) / rows.length)
    : 0;

  const repeatViolations = useMemo(() => {
    const counts = new Map<string, { requirement: string; rule: string; count: number }>();
    for (const i of rows) {
      for (const c of i.checks) {
        if (c.status !== "FAIL" || c.decision === "FALSE_POSITIVE") continue;
        const prev = counts.get(c.id);
        if (prev) prev.count += 1;
        else counts.set(c.id, { requirement: c.requirement, rule: c.ruleReference, count: 1 });
      }
    }
    return [...counts.values()].sort((a, b) => b.count - a.count);
  }, [rows]);

  return (
    <AppShell
      title={productName}
      subtitle="Product compliance history across inspections"
      actions={
        <Link
          to="/inspections"
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          History
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Inspections recorded" value={String(rows.length)} />
        <Stat label="Average compliance score" value={`${avgScore}%`} />
        <Stat
          label="Recurring violation types"
          value={String(repeatViolations.filter((v) => v.count > 1).length)}
        />
      </div>

      <section className="panel mt-6 overflow-hidden">
        <header className="flex items-center gap-2 border-b border-border px-5 py-3">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Inspection timeline</h2>
        </header>
        {rows.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">
            No inspections recorded for this product yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left">
                <tr className="label-caps">
                  <th className="px-5 py-2.5">Inspection</th>
                  <th className="px-5 py-2.5">Date</th>
                  <th className="px-5 py-2.5">Officer</th>
                  <th className="px-5 py-2.5">Score</th>
                  <th className="px-5 py-2.5">Verdict</th>
                  <th className="px-5 py-2.5">Report</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((i) => (
                  <tr key={i.id} className="border-t border-border">
                    <td className="px-5 py-3 font-mono text-xs">
                      <Link to="/inspections/$id" params={{ id: i.id }} className="hover:underline">
                        {i.id}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {new Date(i.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{i.officer}</td>
                    <td className="px-5 py-3 font-semibold">{i.score}%</td>
                    <td className="px-5 py-3">
                      <VerdictPill verdict={i.verdict} />
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        to="/reports/$id"
                        params={{ id: i.id }}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {repeatViolations.length > 0 && (
        <section className="panel mt-6 overflow-hidden">
          <header className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold">Violation pattern</h2>
            <p className="text-xs text-muted-foreground">
              Officer-retained violations aggregated across all inspections of this product.
            </p>
          </header>
          <ul className="divide-y divide-border">
            {repeatViolations.map((v) => (
              <li key={v.requirement} className="flex items-center gap-4 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{v.requirement}</p>
                  <p className="text-[11px] text-muted-foreground">{v.rule}</p>
                </div>
                <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                  {v.count}× flagged
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel px-5 py-4">
      <p className="label-caps">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
