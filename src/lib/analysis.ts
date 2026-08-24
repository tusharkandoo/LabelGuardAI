import type { EvidenceBox, ExtractedLabel } from "./types";

type AiField =
  | {
      text?: string | null;
      x?: number | null;
      y?: number | null;
      w?: number | null;
      h?: number | null;
      confidence?: number | null;
    }
  | null
  | undefined;

type AiResult = {
  productName?: string | null | undefined;
  isImported?: boolean | null | undefined;
  minFontHeightMm?: number | null | undefined;
  rawText?: string | null | undefined;
  [key: string]: unknown;
};

const FIELDS = [
  "manufacturer",
  "address",
  "netQuantity",
  "mrp",
  "mfgDate",
  "consumerCare",
  "countryOfOrigin",
  "fssai",
] as const;

const clamp = (n: number) => Math.min(1, Math.max(0, n));

export function normalizeAiResult(ai: AiResult): ExtractedLabel {
  const boxes: EvidenceBox[] = [];
  const values: Record<string, string | undefined> = {};

  for (const field of FIELDS) {
    const raw = ai[field] as AiField;
    const text = raw?.text?.trim();
    if (!text) continue;
    values[field] = text;
    if (raw && raw.x != null && raw.y != null && raw.w != null && raw.h != null) {
      boxes.push({
        field,
        text,
        x: clamp(raw.x),
        y: clamp(raw.y),
        w: clamp(raw.w),
        h: clamp(raw.h),
        confidence: raw.confidence != null ? clamp(raw.confidence) : 0.88,
      });
    }
  }

  return {
    productName: ai.productName?.trim() || undefined,
    manufacturer: values["manufacturer"],
    address: values["address"],
    netQuantity: values["netQuantity"],
    mrp: values["mrp"],
    mfgDate: values["mfgDate"],
    consumerCare: values["consumerCare"],
    countryOfOrigin: values["countryOfOrigin"],
    fssai: values["fssai"],
    isImported: ai.isImported ?? undefined,
    minFontHeightMm: ai.minFontHeightMm ?? undefined,
    rawText: ai.rawText?.trim() ?? "",
    boxes,
    source: "ai-vision",
  };
}

/** Deterministic demo extraction used when live AI vision is unavailable. */
export function demoExtraction(productName?: string): ExtractedLabel {
  return {
    productName: productName || "Demo Packaged Commodity",
    manufacturer: "Sunrise Foods Pvt. Ltd.",
    address: "Plot 42, Industrial Area Phase II, New Delhi 110020",
    netQuantity: "Net Qty. 500 g",
    mrp: "MRP ₹120.00",
    mfgDate: "Packed: 07/2026",
    fssai: "10012041000123",
    minFontHeightMm: 0.9,
    rawText:
      "SUNRISE PREMIUM BISCUITS · Net Qty. 500 g · MRP ₹120.00 · Packed: 07/2026 · Mfd by Sunrise Foods Pvt. Ltd., Plot 42, Industrial Area Phase II, New Delhi 110020 · FSSAI 10012041000123",
    source: "demo-fallback",
    note: "Demo extraction — live AI vision unavailable, deterministic sample declarations used.",
    boxes: [
      {
        field: "manufacturer",
        text: "Mfd by Sunrise Foods Pvt. Ltd.",
        x: 0.08,
        y: 0.62,
        w: 0.5,
        h: 0.07,
        confidence: 0.93,
      },
      {
        field: "address",
        text: "Plot 42, Industrial Area Phase II, New Delhi 110020",
        x: 0.08,
        y: 0.7,
        w: 0.62,
        h: 0.07,
        confidence: 0.9,
      },
      {
        field: "netQuantity",
        text: "Net Qty. 500 g",
        x: 0.1,
        y: 0.44,
        w: 0.28,
        h: 0.07,
        confidence: 0.96,
      },
      { field: "mrp", text: "MRP ₹120.00", x: 0.56, y: 0.44, w: 0.3, h: 0.08, confidence: 0.94 },
      {
        field: "mfgDate",
        text: "Packed: 07/2026",
        x: 0.56,
        y: 0.55,
        w: 0.3,
        h: 0.06,
        confidence: 0.91,
      },
      {
        field: "fontSize",
        text: "Smallest declaration ≈ 0.9 mm",
        x: 0.08,
        y: 0.78,
        w: 0.66,
        h: 0.05,
        confidence: 0.82,
      },
      {
        field: "consumerCare",
        text: "No consumer care region detected",
        x: 0.08,
        y: 0.86,
        w: 0.5,
        h: 0.08,
        confidence: 0.94,
      },
    ],
  };
}

export function fileToDataUrl(file: File, maxSize = 1400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Unsupported image."));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(String(reader.result));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_FILE_BYTES = 8 * 1024 * 1024;
