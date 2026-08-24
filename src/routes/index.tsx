import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, ScanLine, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveOfficer } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LabelGuard AI — Legal Metrology Compliance Inspection" },
      {
        name: "description",
        content:
          "Officer sign-in for LabelGuard AI: AI-assisted label scanning and rule-based compliance checks under the Legal Metrology (Packaged Commodities) Rules, 2011.",
      },
      { property: "og:title", content: "LabelGuard AI — Legal Metrology Compliance Inspection" },
      {
        property: "og:description",
        content:
          "Scan packaged commodity labels, validate mandatory declarations and generate inspection reports.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function signIn(officerEmail: string, name: string) {
    saveOfficer({
      name,
      email: officerEmail,
      designation: "Legal Metrology Enforcement Officer",
      zone: "Delhi Zone — Circle 4",
      role: "Enforcement Officer",
    });
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="h-1 gov-stripe" />
      <div className="mx-auto grid min-h-[calc(100vh-4px)] max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-2 lg:px-6">
        <section className="order-2 lg:order-1">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xl font-semibold">LabelGuard AI</p>
              <p className="text-xs text-muted-foreground">
                AI-assisted packaged commodity compliance inspection
              </p>
            </div>
          </div>

          <h2 className="mt-8 font-serif text-3xl leading-tight sm:text-4xl">
            Scan a package. Validate every mandatory declaration.
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
            LabelGuard AI extracts declarations from label images and applies a deterministic rule
            engine built on the Legal Metrology (Packaged Commodities) Rules, 2011 — manufacturer
            particulars, net quantity, MRP, date of packing, consumer care details and character
            height — then produces an evidence-linked inspection report for officer verification.
          </p>

          <dl className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ["9 rule checks", "Rules 6, 8, 9 & 10 encoded deterministically"],
              ["Evidence linked", "Every finding mapped to a region on the label"],
              ["Officer in control", "AI assists; the officer confirms every violation"],
            ].map(([term, desc]) => (
              <div key={term} className="panel p-4">
                <dt className="text-sm font-semibold">{term}</dt>
                <dd className="mt-1 text-xs text-muted-foreground">{desc}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-8 text-[11px] leading-relaxed text-muted-foreground">
            Department of Consumer Affairs · Ministry of Consumer Affairs, Food &amp; Public
            Distribution · Prototype for SIH problem statement 26034. Assessments are preliminary
            and not legally determinative.
          </p>
        </section>

        <section className="order-1 lg:order-2">
          <div className="panel mx-auto w-full max-w-md p-6 sm:p-8">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Lock className="h-4 w-4 text-muted-foreground" />
              Officer sign-in
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Authorised enforcement personnel only. Access is logged.
            </p>

            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email.trim())) {
                  setError("Enter a valid official e-mail address.");
                  return;
                }
                if (password.length < 6) {
                  setError("Password must be at least 6 characters.");
                  return;
                }
                setError(null);
                const name = (email.trim().split("@")[0] ?? "officer").replace(/[._]/g, " ");
                signIn(
                  email.trim(),
                  name.replace(/\b\w/g, (c) => c.toUpperCase()),
                );
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="email">Official e-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  maxLength={120}
                  placeholder="officer@lm.delhi.gov.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  maxLength={80}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full">
                Sign in
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              demo access
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => signIn("r.sharma@lm.delhi.gov.in", "R. Sharma")}
            >
              <ScanLine className="mr-2 h-4 w-4" />
              Continue as demo officer
            </Button>

            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
              Demo authentication is used for this prototype; production deployment integrates
              department SSO with role-based access.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
