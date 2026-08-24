import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { VerdictPill } from "@/components/StatusPill";
import { Input } from "@/components/ui/input";
import { loadInspections } from "@/lib/store";
import type { Inspection } from "@/lib/types";

export const Route = createFileRoute("/inspections/")({
  head: () => ({
    meta: [
      { title: "Inspection History — LabelGuard AI" },
      {
        name: "description",
        content:
          "Search and retrieve previously scanned packaged commodities, compliance scores, violations and inspection reports.",
      },
      { property: "og:title", content: "Inspection History — LabelGuard AI" },
      {
        property: "og:description",
        content: "Searchable repository of packaged commodity inspections and compliance history.",
      },
    ],
  }),
  component: HistoryPage,
});

const STATUS_OPTIONS = ["ALL", "COMPLIANT", "POTENTIALLY_NON_COMPLIANT", "NON_COMPLIANT"] as const;

function HistoryPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("ALL");
  const [since, setSince] = useState("");

  useEffect(() => {
    const sync = () => setInspections(loadInspections());
    sync();
    window.addEventListener("labelguard:updated", sync);
    return () => window.removeEventListener("labelguard:updated", sync);
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inspections.filter((i) => {
      if (status !== "ALL" && i.verdict !== status) return false;
      if (since && new Date(i.createdAt) < new Date(since)) return false;
      if (!q) return true;
      return (
        i.productName.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q) ||
        i.officer.toLowerCase().includes(q)
      );
    });
  }, [inspections, query, status, since]);

  return (
    <AppShell
      title="Inspection history"
      subtitle="Repository of scanned packaged commodities and compliance outcomes"
    >
      <div className="panel p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search product, inspection ID or officer"
              maxLength={80}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            className="h-9 rounded-md border border-input bg-card px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as (typeof STATUS_OPTIONS)[number])}
          >
            <option value="ALL">All statuses</option>
            <option value="COMPLIANT">Compliant</option>
            <option value="POTENTIALLY_NON_COMPLIANT">Potentially non-compliant</option>
            <option value="NON_COMPLIANT">Non-compliant</option>
          </select>
          <input
            type="date"
            className="h-9 rounded-md border border-input bg-card px-3 text-sm"
            value={since}
            onChange={(e) => setSince(e.target.value)}
            aria-label="Inspected on or after"
          />
        </div>
      </div>

      <div className="panel mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-surface text-left">
              <tr className="label-caps">
                <th className="px-5 py-2.5">Inspection ID</th>
                <th className="px-5 py-2.5">Product</th>
                <th className="px-5 py-2.5">Date</th>
                <th className="px-5 py-2.5">Officer</th>
                <th className="px-5 py-2.5">Status</th>
                <th className="px-5 py-2.5">Violations</th>
                <th className="px-5 py-2.5">Score</th>
                <th className="px-5 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i.id} className="border-t border-border hover:bg-surface/60">
                  <td className="px-5 py-3 font-mono text-xs">{i.id}</td>
                  <td className="px-5 py-3 font-medium">
                    <Link
                      to="/products/$slug"
                      params={{ slug: encodeURIComponent(i.productName) }}
                      className="underline-offset-2 hover:underline"
                    >
                      {i.productName}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {new Date(i.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{i.officer}</td>
                  <td className="px-5 py-3">
                    <VerdictPill verdict={i.verdict} />
                  </td>
                  <td className="px-5 py-3 tabular-nums">
                    {i.checks.filter((c) => c.status === "FAIL").length}
                  </td>
                  <td className="px-5 py-3 tabular-nums">{i.score}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-3">
                      <Link
                        to="/inspections/$id"
                        params={{ id: i.id }}
                        className="font-medium text-primary underline-offset-2 hover:underline"
                      >
                        Analysis
                      </Link>
                      <Link
                        to="/reports/$id"
                        params={{ id: i.id }}
                        className="font-medium text-primary underline-offset-2 hover:underline"
                      >
                        Report
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">
                    No inspections match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
