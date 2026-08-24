import type { CheckStatus, ComplianceCheck, ExtractedLabel } from "./types";

/**
 * Deterministic rule engine for the Legal Metrology (Packaged Commodities)
 * Rules, 2011. Each rule is a pure function of the extracted declarations —
 * no LLM decides compliance. Add a new rule by appending to RULES.
 */
export interface RuleDefinition {
  id: string;
  requirement: string;
  category: string;
  ruleReference: string;
  weight: number;
  /** Reads the declaration value out of the extraction result. */
  read: (e: ExtractedLabel) => string | undefined;
  /** Returns status + explanation for the extracted value. */
  evaluate: (
    value: string | undefined,
    e: ExtractedLabel,
  ) => { status: CheckStatus; explanation: string };
}

const missing = (label: string) => ({
  status: "FAIL" as CheckStatus,
  explanation: `${label} could not be detected on the principal display panel. A mandatory declaration appears to be absent.`,
});

const QTY_RE = /(\d+(?:[.,]\d+)?)\s*(g|gm|gms|kg|ml|l|litre|liter|mg|pcs|pieces|N|nos)\b/i;
const MRP_RE = /(₹|rs\.?|inr)\s*\.?\s*\d+(?:[.,]\d{1,2})?/i;
const MRP_TAX_RE = /(incl|inclusive)[^.]{0,25}tax|mrp\s*\(?incl/i;
const DATE_RE =
  /(0[1-9]|1[0-2])\s*[/.-]\s*(20\d{2}|\d{2})|((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*'?\s*(20)?\d{2})/i;
const PHONE_RE = /(\+91[\s-]?)?(1800[\s-]?\d{3}[\s-]?\d{3,4}|[6-9]\d{9})/;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]{2,}/;

export const RULES: RuleDefinition[] = [
  {
    id: "manufacturer",
    requirement: "Name of manufacturer / packer / importer",
    category: "Identity of Package",
    ruleReference: "Rule 6(1)(a), LM (PC) Rules, 2011",
    weight: 15,
    read: (e) => e.manufacturer,
    evaluate: (v) =>
      !v
        ? missing("Manufacturer / packer / importer name")
        : v.trim().length < 4
          ? {
              status: "REVIEW",
              explanation:
                "A name was detected but is too short to confirm it identifies the manufacturer, packer or importer. Manual verification required.",
            }
          : {
              status: "PASS",
              explanation:
                "Name of the manufacturer / packer / importer is declared as required on the principal display panel.",
            },
  },
  {
    id: "address",
    requirement: "Complete address of manufacturer / packer",
    category: "Identity of Package",
    ruleReference: "Rule 6(1)(a) & Rule 10, LM (PC) Rules, 2011",
    weight: 12,
    read: (e) => e.address,
    evaluate: (v) => {
      if (!v) return missing("Complete address");
      const hasPin = /\b\d{6}\b/.test(v);
      if (!hasPin)
        return {
          status: "WARN",
          explanation:
            "Address detected but no 6-digit PIN code found. Rule 10 requires a complete address sufficient to locate the manufacturer/packer.",
        };
      return { status: "PASS", explanation: "Complete address including PIN code is declared." };
    },
  },
  {
    id: "netQuantity",
    requirement: "Net quantity in standard units",
    category: "Quantity Declaration",
    ruleReference: "Rule 6(1)(d) & Rule 8, LM (PC) Rules, 2011",
    weight: 15,
    read: (e) => e.netQuantity,
    evaluate: (v) => {
      if (!v) return missing("Net quantity declaration");
      if (!QTY_RE.test(v))
        return {
          status: "FAIL",
          explanation:
            "Net quantity is not declared in the prescribed standard units (g, kg, ml, l or number). Non-standard or descriptive quantity declarations are not permitted.",
        };
      if (/approx|about|nett?\s*wt\.?\s*approx/i.test(v))
        return {
          status: "FAIL",
          explanation:
            "Qualifying words such as 'approximately' or 'about' must not accompany the net quantity declaration.",
        };
      return {
        status: "PASS",
        explanation: "Net quantity is declared in standard units without qualifying expressions.",
      };
    },
  },
  {
    id: "mrp",
    requirement: "Retail sale price (MRP) inclusive of all taxes",
    category: "Price Declaration",
    ruleReference: "Rule 6(1)(e) & Rule 2(r), LM (PC) Rules, 2011",
    weight: 15,
    read: (e) => e.mrp,
    evaluate: (v) => {
      if (!v) return missing("Maximum Retail Price (MRP)");
      if (!MRP_RE.test(v))
        return {
          status: "FAIL",
          explanation:
            "Price detected but not declared in the prescribed form (e.g. 'MRP ₹120.00'). Currency symbol or amount could not be validated.",
        };
      if (!MRP_TAX_RE.test(v))
        return {
          status: "WARN",
          explanation:
            "The words 'inclusive of all taxes' (or 'incl. of all taxes') were not detected alongside the retail sale price, as required by Rule 2(r).",
        };
      return {
        status: "PASS",
        explanation: "Retail sale price is declared as MRP inclusive of all taxes.",
      };
    },
  },
  {
    id: "mfgDate",
    requirement: "Month & year of manufacture / packing / import",
    category: "Date Declaration",
    ruleReference: "Rule 6(1)(c), LM (PC) Rules, 2011",
    weight: 12,
    read: (e) => e.mfgDate,
    evaluate: (v) => {
      if (!v) return missing("Month and year of manufacture / packing");
      if (!DATE_RE.test(v))
        return {
          status: "FAIL",
          explanation:
            "Date declaration detected but not in the prescribed month-and-year format (MM/YYYY or MON YYYY).",
        };
      return {
        status: "PASS",
        explanation:
          "Month and year of manufacture / packing is declared in the prescribed format.",
      };
    },
  },
  {
    id: "consumerCare",
    requirement: "Consumer care details (name, phone / email)",
    category: "Consumer Care",
    ruleReference: "Rule 6(1)(f), LM (PC) Rules, 2011",
    weight: 12,
    read: (e) => e.consumerCare,
    evaluate: (v) => {
      if (!v) return missing("Consumer care declaration");
      const ok = PHONE_RE.test(v) || EMAIL_RE.test(v);
      if (!ok)
        return {
          status: "FAIL",
          explanation:
            "Consumer care text detected but no valid telephone number or e-mail address found. Rule 6(1)(f) requires contact particulars for consumer complaints.",
        };
      return {
        status: "PASS",
        explanation: "Consumer care details include a contactable telephone number and/or e-mail.",
      };
    },
  },
  {
    id: "countryOfOrigin",
    requirement: "Country of origin (imported packages)",
    category: "Import Declaration",
    ruleReference: "Rule 6(1)(b) proviso, LM (PC) Rules, 2011",
    weight: 6,
    read: (e) => e.countryOfOrigin,
    evaluate: (v, e) => {
      if (v) return { status: "PASS", explanation: `Country of origin declared as ${v}.` };
      if (e.isImported)
        return {
          status: "FAIL",
          explanation:
            "Package appears to be imported but no country of origin declaration was detected, as required for imported packages.",
        };
      return {
        status: "REVIEW",
        explanation:
          "No country of origin declaration found. This is mandatory only for imported packages — officer to verify whether the package is imported.",
      };
    },
  },
  {
    id: "fontSize",
    requirement: "Height of numerals & letters (readability)",
    category: "Readability",
    ruleReference: "Rule 9(1) & Sixth Schedule, LM (PC) Rules, 2011",
    weight: 8,
    read: (e) => (e.minFontHeightMm ? `${e.minFontHeightMm} mm (smallest declaration)` : undefined),
    evaluate: (_v, e) => {
      const h = e.minFontHeightMm;
      if (h == null)
        return {
          status: "REVIEW",
          explanation:
            "Character height could not be measured reliably from the supplied image (no scale reference). Physical measurement required under Rule 9.",
        };
      if (h < 1)
        return {
          status: "FAIL",
          explanation: `Smallest declaration measured at approximately ${h} mm. Rule 9 prescribes a minimum height of 1 mm for declarations, and larger heights for net quantity depending on package area.`,
        };
      if (h < 1.6)
        return {
          status: "WARN",
          explanation: `Smallest declaration measured at approximately ${h} mm — close to the prescribed minimum. Verify against the Sixth Schedule for the package's area / net quantity.`,
        };
      return {
        status: "PASS",
        explanation: `Smallest declaration measured at approximately ${h} mm, above the prescribed minimum height.`,
      };
    },
  },
  {
    id: "principalPanel",
    requirement: "Declarations grouped & legible on principal display panel",
    category: "Placement",
    ruleReference: "Rule 9(2) & Rule 6(3), LM (PC) Rules, 2011",
    weight: 5,
    read: (e) => (e.boxes.length ? `${e.boxes.length} declaration regions localized` : undefined),
    evaluate: (_v, e) => {
      if (e.boxes.length < 3)
        return {
          status: "REVIEW",
          explanation:
            "Too few declaration regions were localized on the supplied panel image to assess grouping and placement. Additional panel photographs recommended.",
        };
      return {
        status: "PASS",
        explanation:
          "Mandatory declarations appear grouped together and legible on a single display panel of the package.",
      };
    },
  },
];

export function runRuleEngine(extracted: ExtractedLabel): ComplianceCheck[] {
  return RULES.map((rule) => {
    const value = rule.read(extracted);
    const { status, explanation } = rule.evaluate(value, extracted);
    const box = extracted.boxes.find((b) => b.field === rule.id);
    return {
      id: rule.id,
      requirement: rule.requirement,
      category: rule.category,
      extractedValue: value ?? null,
      status,
      confidence: box?.confidence ?? (value ? 0.86 : 0.91),
      evidence: box?.text ?? value ?? "No corresponding text region detected in the label image.",
      ruleReference: rule.ruleReference,
      explanation,
      weight: rule.weight,
      decision: status === "PASS" ? "CONFIRMED" : "PENDING",
    } satisfies ComplianceCheck;
  });
}

export function scoreOf(checks: ComplianceCheck[]): number {
  const total = checks.reduce((s, c) => s + c.weight, 0);
  const earned = checks.reduce((s, c) => {
    const factor =
      c.decision === "FALSE_POSITIVE"
        ? 1
        : c.status === "PASS"
          ? 1
          : c.status === "WARN"
            ? 0.5
            : c.status === "REVIEW"
              ? 0.6
              : 0;
    return s + c.weight * factor;
  }, 0);
  return Math.round((earned / total) * 100);
}

export function verdictOf(checks: ComplianceCheck[], score: number): Inspection_Verdict {
  const fails = checks.filter((c) => c.status === "FAIL" && c.decision !== "FALSE_POSITIVE").length;
  if (fails >= 3 || score < 60) return "NON_COMPLIANT";
  if (fails > 0 || score < 95) return "POTENTIALLY_NON_COMPLIANT";
  return "COMPLIANT";
}

type Inspection_Verdict = "COMPLIANT" | "POTENTIALLY_NON_COMPLIANT" | "NON_COMPLIANT";
