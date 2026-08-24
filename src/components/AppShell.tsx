import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  ScanLine,
  ShieldCheck,
  X,
} from "lucide-react";
import { clearOfficer, loadOfficer } from "@/lib/store";
import type { Officer } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/inspect", label: "New inspection", Icon: ScanLine },
  { to: "/inspections", label: "Inspection history", Icon: ClipboardList },
] as const;

export function AppShell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const [officer, setOfficer] = useState<Officer | null>(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const current = loadOfficer();
    if (!current) {
      navigate({ to: "/", replace: true });
      return;
    }
    setOfficer(current);
  }, [navigate]);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="min-h-screen bg-background">
      <div className="h-1 gov-stripe" />
      <div className="flex min-h-[calc(100vh-4px)]">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:static lg:flex lg:translate-x-0",
            open ? "flex translate-x-0" : "hidden -translate-x-full lg:flex",
          )}
        >
          <div className="flex items-center gap-2.5 border-b border-sidebar-border px-5 py-4">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">LabelGuard AI</p>
              <p className="truncate text-[11px] text-sidebar-foreground/65">
                Legal Metrology Compliance
              </p>
            </div>
            <button
              className="ml-auto lg:hidden"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 p-3">
            {NAV.map(({ to, label, Icon }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  pathname === to && "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="border-t border-sidebar-border p-4 text-[11px] leading-relaxed text-sidebar-foreground/60">
            <p className="font-semibold text-sidebar-foreground/80">Dept. of Consumer Affairs</p>
            <p>Ministry of Consumer Affairs, Food &amp; Public Distribution</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
            <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
              <button
                className="lg:hidden"
                onClick={() => setOpen(true)}
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-lg font-semibold sm:text-xl">{title}</h1>
                {subtitle && (
                  <p className="truncate text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {actions}
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium">{officer?.name ?? "—"}</p>
                  <p className="text-[11px] text-muted-foreground">{officer?.designation}</p>
                </div>
                <button
                  className="grid h-9 w-9 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted"
                  aria-label="Sign out"
                  onClick={() => {
                    clearOfficer();
                    navigate({ to: "/" });
                  }}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>

          <footer className="border-t border-border px-4 py-4 text-[11px] text-muted-foreground sm:px-6">
            LabelGuard AI produces AI-assisted preliminary assessments under the Legal Metrology
            (Packaged Commodities) Rules, 2011. Findings are not legally determinative and require
            officer verification.
          </footer>
        </div>
      </div>
    </div>
  );
}
