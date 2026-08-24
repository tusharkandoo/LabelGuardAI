import { runRuleEngine, scoreOf, verdictOf } from "./rules";
import type { ExtractedLabel, Inspection } from "./types";

function build(
  id: string,
  productName: string,
  officer: string,
  daysAgo: number,
  category: string,
  overrides: { [K in keyof ExtractedLabel]?: ExtractedLabel[K] | undefined },
): Inspection {
  const extracted: ExtractedLabel = {
    productName,
    manufacturer: "Sunrise Foods Pvt. Ltd.",
    address: "Plot 42, Industrial Area Phase II, New Delhi 110020",
    netQuantity: "Net Qty. 500 g",
    mrp: "MRP ₹120.00 (incl. of all taxes)",
    mfgDate: "Packed: 07/2026",
    consumerCare: "Consumer care: care@sunrisefoods.in, 1800 111 222",
    fssai: "10012041000123",
    minFontHeightMm: 1.8,
    rawText: "",
    boxes: [],
    source: "demo-fallback",
    ...(overrides as Partial<ExtractedLabel>),
  };
  const checks = runRuleEngine(extracted);
  const score = scoreOf(checks);
  return {
    id,
    productName,
    category,
    officer,
    createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    images: [],
    extracted,
    checks,
    score,
    verdict: verdictOf(checks, score),
  };
}

export const demoInspections: Inspection[] = [
  build("LM-2026-0006", "Sunrise Atta 5kg", "S. Iyer", 1, "Food grain", {
    productName: "Sunrise Atta 5kg",
    netQuantity: "Net Qty. 5 kg",
    minFontHeightMm: 2.4,
  }),
  build("LM-2026-0005", "Nutriwave Oats 1kg", "R. Sharma", 2, "Packaged food", {
    consumerCare: undefined,
    minFontHeightMm: 1.4,
  }),
  build("LM-2026-0004", "GlowVeda Face Cream 50g", "A. Khan", 4, "Cosmetics", {
    manufacturer: "GlowVeda Personal Care LLP",
    address: "Unit 9, MIDC Andheri, Mumbai",
    netQuantity: "Net Wt. approx 50 g",
    mrp: "₹349",
    minFontHeightMm: 0.8,
  }),
  build("LM-2026-0003", "Chef's Choice Olive Oil 1L", "R. Sharma", 6, "Imported food", {
    manufacturer: "Olivera S.p.A., imported by Gourmet India Pvt Ltd",
    netQuantity: "Net Vol. 1 l",
    countryOfOrigin: "Italy",
    isImported: true,
    minFontHeightMm: 2.1,
  }),
  build("LM-2026-0002", "DailyPure Detergent 2kg", "S. Iyer", 9, "Household", {
    mfgDate: undefined,
    mrp: "MRP ₹210",
    minFontHeightMm: 1.9,
  }),
  build("LM-2026-0001", "Aroma Masala Tea 250g", "A. Khan", 12, "Beverages", {
    netQuantity: "Net Qty. 250 g",
    minFontHeightMm: 2.0,
  }),
];
