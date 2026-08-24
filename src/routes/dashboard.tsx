import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, ClipboardCheck, FileWarning, Gauge, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { VerdictPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { loadInspections } from "@/lib/store";
import type { Inspection } from "@/lib/types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Enforcement Dashboard — LabelGuard AI" },
      {
        name: "description",
        content:
          "Monitor packaged commodity inspections, compliance trends and detected Legal Metrology violations across your circle.",
      },
      { property: "og:title", content: "Enforcement Dashboard — LabelGuard AI" },
      {
        property: "og:description",
        content:
          "Inspection volumes, compliance trend and violation categories for enforcement officers.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);

  useEffect(() => {
    const sync = () => setInspections(loadInspections());
    sync();
    window.addEventListener("labelguard:updated", sync);
    return () => window.removeEventListener("labelguard:updated", sync);
  }, []);

  const stats = useMemo(() => {
    const total = inspections.length;
    const compliant = inspections.filter((i) => i.verdict === "COMPLIANT").length;
    const nonCompliant = inspections.filter((i) => i.verdict !== "COMPLIANT").length;
    const violations = inspections.reduce(
      (s, i) => s + i.checks.filter((c) => c.status === "FAIL").length,
      0,
    );
    const pending = inspections.reduce(
      (s, i) => s + i.checks.filter((c) => c.decision === "PENDING").length,
      0,
    );
    return { total, compliant, nonCompliant, violations, pending };
  }, [inspections]);

  const trend = useMemo(() => {
    const buckets = new Map<string, { date: string; score: number; count: number }>();
    [...inspections]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .forEach((i) => {
        const date = new Date(i.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        });
        const entry = buckets.get(date) ?? { date, score: 0, count: 0 };
        entry.score += i.score;
        entry.count += 1;
        buckets.set(date, entry);
      });
    return [...buckets.values()].map((b) => ({
      date: b.date,
      score: Math.round(b.score / b.count),
    }));
  }, [inspections]);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    inspections.forEach((i) =>
      i.checks
        .filter((c) => c.status === "FAIL" || c.status === "WARN")
        .forEach((c) => map.set(c.category, (map.get(c.category) ?? 0) + 1)),
    );
    return [...map.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [inspections]);

  return (
    <AppShell
      title="Enforcement dashboard"
      subtitle="Delhi Zone — Circle 4 · Legal Metrology (Packaged Commodities) Rules, 2011"
      actions={
        <Button asChild size="sm">
          <Link to="/inspect">
            <Plus className="mr-1.5 h-4 w-4" />
            New inspection
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total inspections" value={stats.total} Icon={ClipboardCheck} />
        <StatCard label="Compliant" value={stats.compliant} Icon={Gauge} tone="success" />
        <StatCard
          label="Non-compliant"
          value={stats.nonCompliant}
          Icon={FileWarning}
          tone="destructive"
        />
        <StatCard
          label="Violations detected"
          value={stats.violations}
          Icon={AlertTriangle}
          tone="warning"
        />
        <StatCard label="Pending review" value={stats.pending} Icon={AlertTriangle} tone="info" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <div className="panel p-5 lg:col-span-3">
          <p className="label-caps">Compliance score trend</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Average assessed score per inspection date
          </p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ left: -20, right: 8, top: 8 }}>
                <CartesianGrid
                  stroke="var(--color-border)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  stroke="var(--color-muted-foreground)"
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  stroke="var(--color-muted-foreground)"
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-5 lg:col-span-2">
          <p className="label-caps">Violation categories</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Failed and flagged checks by rule category
          </p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories} margin={{ left: -22, right: 8, top: 8 }}>
                <CartesianGrid
                  stroke="var(--color-border)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-18}
                  textAnchor="end"
                  height={54}
                  stroke="var(--color-muted-foreground)"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  stroke="var(--color-muted-foreground)"
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="panel mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="text-sm font-semibold">Recent inspections</p>
            <p className="text-xs text-muted-foreground">Latest scanned packaged commodities</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/inspections">View all</Link>
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-surface text-left">
              <tr className="label-caps">
                <th className="px-5 py-2.5">Inspection</th>
                <th className="px-5 py-2.5">Product</th>
                <th className="px-5 py-2.5">Date</th>
                <th className="px-5 py-2.5">Officer</th>
                <th className="px-5 py-2.5">Status</th>
                <th className="px-5 py-2.5">Violations</th>
                <th className="px-5 py-2.5">Report</th>
              </tr>
            </thead>
            <tbody>
              {inspections.slice(0, 6).map((i) => (
                <tr key={i.id} className="border-t border-border">
                  <td className="px-5 py-3 font-mono text-xs">{i.id}</td>
                  <td className="px-5 py-3 font-medium">{i.productName}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {new Date(i.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{i.officer}</td>
                  <td className="px-5 py-3">
                    <VerdictPill verdict={i.verdict} />
                  </td>
                  <td className="px-5 py-3">
                    {i.checks.filter((c) => c.status === "FAIL").length}
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      to="/inspections/$id"
                      params={{ id: i.id }}
                      className="font-medium text-primary underline-offset-2 hover:underline"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
              {inspections.length === 0 && (
                <tr>
                  <td className="px-5 py-8 text-center text-muted-foreground" colSpan={7}>
                    No inspections recorded yet.
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

function StatCard({
  label,
  value,
  Icon,
  tone = "primary",
}: {
  label: string;
  value: number;
  Icon: typeof Gauge;
  tone?: "primary" | "success" | "destructive" | "warning" | "info";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/12 text-success",
    destructive: "bg-destructive/10 text-destructive",
    warning: "bg-warning/15 text-warning-foreground",
    info: "bg-info/12 text-info",
  }[tone];

  return (
    <div className="panel flex items-center gap-3 p-4">
      <span className={`grid h-10 w-10 place-items-center rounded-md ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
