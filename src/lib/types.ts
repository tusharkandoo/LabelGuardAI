export type CheckStatus = "PASS" | "FAIL" | "WARN" | "REVIEW";

export type OfficerDecision = "PENDING" | "CONFIRMED" | "FALSE_POSITIVE" | "MANUAL_REVIEW";

export interface EvidenceBox {
  /** Normalized 0..1 coordinates relative to the image. */
  x: number;
  y: number;
  w: number;
  h: number;
  field: string;
  text: string;
  confidence: number;
}

export interface ExtractedLabel {
  productName?: string | undefined;
  manufacturer?: string | undefined;
  address?: string | undefined;
  netQuantity?: string | undefined;
  mrp?: string | undefined;
  mfgDate?: string | undefined;
  consumerCare?: string | undefined;
  countryOfOrigin?: string | undefined;
  fssai?: string | undefined;
  unitSalePrice?: string | undefined;
  /** Smallest measured declaration height in mm (readability analysis). */
  minFontHeightMm?: number | undefined;
  isImported?: boolean | undefined;
  rawText: string;
  boxes: EvidenceBox[];
  source: "ai-vision" | "demo-fallback";
  note?: string | undefined;
}

export interface ComplianceCheck {
  id: string;
  requirement: string;
  category: string;
  extractedValue: string | null;
  status: CheckStatus;
  confidence: number;
  evidence: string;
  ruleReference: string;
  explanation: string;
  weight: number;
  decision: OfficerDecision;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number | undefined;
  timestamp: string;
}

export interface Inspection {
  id: string;
  productName: string;
  batch?: string | undefined;
  category?: string | undefined;
  officer: string;
  location?: GeoLocation | undefined;
  createdAt: string;
  images: string[];
  extracted: ExtractedLabel;
  checks: ComplianceCheck[];
  score: number;
  verdict: "COMPLIANT" | "POTENTIALLY_NON_COMPLIANT" | "NON_COMPLIANT";
  notes?: string | undefined;
}

export interface Officer {
  name: string;
  email: string;
  designation: string;
  zone: string;
  role: "Enforcement Officer" | "Controller";
}
