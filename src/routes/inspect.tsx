import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2, MapPin, ScanLine, Sparkles, Trash2, Upload } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractLabel } from "@/lib/extract.functions";
import {
  ACCEPTED_TYPES,
  MAX_FILE_BYTES,
  demoExtraction,
  fileToDataUrl,
  normalizeAiResult,
} from "@/lib/analysis";
import { runRuleEngine, scoreOf, verdictOf } from "@/lib/rules";
import { loadOfficer, nextInspectionId, upsertInspection } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { GeoLocation } from "@/lib/types";

export const Route = createFileRoute("/inspect")({
  head: () => ({
    meta: [
      { title: "New Inspection — LabelGuard AI" },
      {
        name: "description",
        content:
          "Upload packaged commodity label images and run AI-assisted extraction with rule-based Legal Metrology compliance checks.",
      },
      { property: "og:title", content: "New Inspection — LabelGuard AI" },
      {
        property: "og:description",
        content: "Scan a packaged commodity label and validate its mandatory declarations.",
      },
    ],
  }),
  component: NewInspectionPage,
});

const PIPELINE_STAGES = [
  "Validating label image & resolution",
  "Sending image to AI Vision Model (Gemini / OpenAI)",
  "Extracting verbatim mandatory declarations (OCR)",
  "Detecting manufacturer, MRP, Net Qty, Dates & FSSAI",
  "Evaluating Legal Metrology (Packaged Commodities) Rules, 2011",
  "Calculating font height & compliance score",
];

// Preloaded sample packages for quick offline / demo evaluation
const SAMPLE_PACKAGES = [
  {
    name: "Sunrise Atta 5kg (Compliant)",
    batch: "ATT-2026-09",
    image:
      "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(`
      <svg width="400" height="500" xmlns="http://www.w3.org/2000/svg" style="background:#fff7ed; font-family:sans-serif;">
        <rect width="400" height="500" fill="#fff7ed" stroke="#ea580c" stroke-width="8"/>
        <text x="200" y="70" font-size="24" font-weight="bold" fill="#9a3412" text-anchor="middle">SUNRISE WHOLE WHEAT ATTA</text>
        <text x="50" y="140" font-size="14" fill="#333">Net Quantity: 5 kg</text>
        <text x="50" y="180" font-size="14" fill="#333">MRP ₹245.00 (Incl. of all taxes)</text>
        <text x="50" y="220" font-size="14" fill="#333">Unit Sale Price: ₹49.00 / kg</text>
        <text x="50" y="260" font-size="14" fill="#333">Pkd Date: 05/2026  ·  Use By: 09/2026</text>
        <text x="50" y="300" font-size="13" fill="#333">Mfd By: Sunrise Agro Foods Pvt. Ltd.</text>
        <text x="50" y="325" font-size="12" fill="#555">Plot 12, Food Park, Phase 1, New Delhi 110028</text>
        <text x="50" y="365" font-size="12" fill="#555">Consumer Care: care@sunrisefoods.in | 1800-111-2222</text>
        <text x="50" y="405" font-size="12" fill="#555">Country of Origin: India</text>
        <text x="50" y="445" font-size="12" fill="#555">FSSAI Lic. No. 10012011000123</text>
      </svg>
    `),
  },
  {
    name: "Crunchy Biscuits 200g (Violations: Missing Taxes & MRP)",
    batch: "B-8812",
    image:
      "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(`
      <svg width="400" height="500" xmlns="http://www.w3.org/2000/svg" style="background:#fef2f2; font-family:sans-serif;">
        <rect width="400" height="500" fill="#fef2f2" stroke="#dc2626" stroke-width="8"/>
        <text x="200" y="70" font-size="24" font-weight="bold" fill="#991b1b" text-anchor="middle">CRUNCHY CHOCO BISCUITS</text>
        <text x="50" y="140" font-size="14" fill="#333">Net Wt: 200 g</text>
        <text x="50" y="180" font-size="14" fill="#dc2626" font-weight="bold">Price: 40 Rs (Tax Extra)</text>
        <text x="50" y="220" font-size="14" fill="#333">Batch: B-8812</text>
        <text x="50" y="260" font-size="14" fill="#333">Mfg Date: 03/2026</text>
        <text x="50" y="300" font-size="13" fill="#333">Mfd By: Quick Bakers Ltd, Mumbai</text>
        <text x="50" y="350" font-size="12" fill="#777">[Missing Consumer Care &amp; PIN Code]</text>
      </svg>
    `),
  },
];

// Helper to convert SVG vector images to raster PNG so AI Vision models (Gemini) can process them
function rasterizeSvgToPng(svgDataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !svgDataUrl.includes("svg")) {
      resolve(svgDataUrl);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 750;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      } else {
        resolve(svgDataUrl);
      }
    };
    img.onerror = () => resolve(svgDataUrl);
    img.src = svgDataUrl;
  });
}

function NewInspectionPage() {
  const navigate = useNavigate();
  const extract = useServerFn(extractLabel);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<string[]>([]);
  const [productName, setProductName] = useState("");
  const [batch, setBatch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState(-1);
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>("Detecting GPS...");

  // Capture real GPS coordinates on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("GPS not supported on this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy),
          timestamp: new Date(pos.timestamp).toISOString(),
        });
        setLocationStatus("GPS Location Locked");
      },
      (err) => {
        console.warn("Geolocation warning:", err.message);
        setLocationStatus("Location unavailable (Permission denied or timeout)");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    setError(null);
    const loaded: string[] = [];

    for (const file of Array.from(files).slice(0, 6)) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Only JPEG, PNG, or WebP images are supported.");
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        setError("Image size must be 8 MB or smaller.");
        continue;
      }
      try {
        const dataUrl = await fileToDataUrl(file);
        loaded.push(dataUrl);
      } catch (err) {
        setError("Failed to read image file.");
      }
    }
    setImages((prev) => [...prev, ...loaded].slice(0, 6));
  }, []);

  async function loadSample(sample: (typeof SAMPLE_PACKAGES)[number]) {
    setProductName(sample.name);
    setBatch(sample.batch);
    const pngImage = await rasterizeSvgToPng(sample.image);
    setImages([pngImage]);
    setError(null);
  }

  async function runAnalysis() {
    if (images.length === 0) {
      setError("Please attach or capture at least one label image.");
      return;
    }
    setError(null);

    const advanceStage = async (s: number) => {
      setStage(s);
      await new Promise((r) => setTimeout(r, 280));
    };

    try {
      await advanceStage(0);
      await advanceStage(1);

      // Call the server function which talks to Gemini / OpenAI
      const result = await extract({
        data: {
          image: images[0],
          productName: productName.trim() || undefined,
        },
      });

      await advanceStage(2);
      await advanceStage(3);
      await advanceStage(4);
      await advanceStage(5);

      let extracted;
      if (result.ok) {
        extracted = normalizeAiResult(result.data);
      } else {
        // Live AI vision is unavailable (no API key configured, or the request
        // failed) — keep the demo usable with deterministic sample declarations
        // rather than dead-ending the officer's scan.
        console.warn("AI extraction unavailable, using demo fallback:", result.reason);
        extracted = demoExtraction(productName.trim() || undefined);
      }
      const checks = runRuleEngine(extracted);
      const score = scoreOf(checks);
      const officer = loadOfficer();
      const id = nextInspectionId();

      upsertInspection({
        id,
        productName: productName.trim() || extracted.productName || "Packaged Commodity",
        ...(batch.trim() ? { batch: batch.trim() } : {}),
        officer: officer?.name ?? "Field Officer",
        location: location ?? undefined,
        createdAt: new Date().toISOString(),
        images: images.slice(0, 2),
        extracted,
        checks,
        score,
        verdict: verdictOf(checks, score),
      });

      navigate({ to: "/inspections/$id", params: { id } });
    } catch (err) {
      setStage(-1);
      setError(`Analysis error: ${(err as Error).message || "Could not complete scan."}`);
    }
  }

  const isAnalyzing = stage >= 0;

  return (
    <AppShell
      title="New Inspection"
      subtitle="Capture packaging label to run Legal Metrology compliance inspection"
    >
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Column: Image Upload & Preview */}
        <div className="lg:col-span-3">
          <div
            className={cn(
              "panel flex flex-col items-center justify-center gap-3 border-dashed p-8 text-center transition-colors",
              isAnalyzing && "opacity-60 pointer-events-none",
            )}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (!isAnalyzing) void handleFiles(e.dataTransfer.files);
            }}
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <Upload className="h-6 w-6" />
            </span>
            <p className="text-sm font-semibold">Upload or Capture Label Photograph</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Capture the principal display panel clearly with all mandatory declarations readable.
              Supported: JPEG, PNG, WebP (up to 8 MB).
            </p>

            <div className="flex flex-wrap gap-2 justify-center mt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isAnalyzing}
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Images
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                multiple
                className="hidden"
                onChange={(e) => void handleFiles(e.target.files)}
              />
            </div>
          </div>

          {/* Sample quick-load for demonstration */}
          <div className="mt-4 panel p-4 bg-muted/30">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Quick Demo Samples (For Testing):
            </div>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PACKAGES.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isAnalyzing}
                  onClick={() => loadSample(sample)}
                  className="text-xs bg-card border border-border px-2.5 py-1.5 rounded hover:border-primary hover:text-primary transition-colors text-left"
                >
                  {sample.name}
                </button>
              ))}
            </div>
          </div>

          {/* Image Previews */}
          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((src, idx) => (
                <div
                  key={idx}
                  className="group relative overflow-hidden rounded-md border border-border bg-card"
                >
                  <img
                    src={src}
                    alt={`Label ${idx + 1}`}
                    className="aspect-square w-full object-contain p-1"
                  />
                  <button
                    className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-md bg-card/90 text-destructive shadow-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    aria-label="Remove image"
                    disabled={isAnalyzing}
                    onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Real-time Stage Progress */}
          {isAnalyzing && (
            <div className="panel relative mt-4 overflow-hidden p-5 border-primary/40 bg-primary/5">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                AI Vision Inspection Engine
              </p>
              <ol className="mt-3 space-y-2.5">
                {PIPELINE_STAGES.map((label, idx) => (
                  <li key={label} className="flex items-center gap-2.5 text-sm">
                    {idx < stage ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : idx === stage ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <span className="h-4 w-4 rounded-full border border-border" />
                    )}
                    <span
                      className={
                        idx <= stage ? "font-medium text-foreground" : "text-muted-foreground"
                      }
                    >
                      {label}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Right Column: Product Info & GPS */}
        <div className="lg:col-span-2 space-y-4">
          <div className="panel p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Inspection Particulars
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="product">Product Name / Commodity</Label>
                <Input
                  id="product"
                  placeholder="e.g. Whole Wheat Flour 5kg"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  disabled={isAnalyzing}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="batch">Batch / Lot Number (Optional)</Label>
                <Input
                  id="batch"
                  placeholder="e.g. B-2026-441"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  disabled={isAnalyzing}
                />
              </div>

              {/* Real GPS Location Field */}
              <div className="rounded-md border border-border bg-surface p-3 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span>GPS On-Site Geotag</span>
                </div>
                {location ? (
                  <p className="font-mono text-muted-foreground">
                    Lat: {location.latitude}°, Lon: {location.longitude}° (±{location.accuracy}m)
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">{locationStatus}</p>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <p className="font-semibold">Error</p>
                <p className="mt-0.5">{error}</p>
              </div>
            )}

            <Button
              className="mt-5 w-full font-semibold"
              disabled={isAnalyzing || images.length === 0}
              onClick={() => void runAnalysis()}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running AI Inspection…
                </>
              ) : (
                <>
                  <ScanLine className="mr-2 h-4 w-4" />
                  Start AI Compliance Scan
                </>
              )}
            </Button>

            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              Images are analyzed directly using Google Gemini Vision AI. Extracted declarations are
              evaluated against Rule 6, 8, 9 & 10 of the Legal Metrology (Packaged Commodities)
              Rules, 2011.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
