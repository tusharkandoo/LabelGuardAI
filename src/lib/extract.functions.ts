import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  image: z.string().min(32).max(9_000_000),
  productName: z.string().max(200).optional(),
});

const fieldSchema = z
  .object({
    text: z.string().optional().nullable(),
    x: z.number().optional().nullable(),
    y: z.number().optional().nullable(),
    w: z.number().optional().nullable(),
    h: z.number().optional().nullable(),
    confidence: z.number().optional().nullable(),
  })
  .optional()
  .nullable();

const aiSchema = z.object({
  productName: z.string().optional().nullable(),
  isImported: z.boolean().optional().nullable(),
  minFontHeightMm: z.number().optional().nullable(),
  rawText: z.string().optional().nullable(),
  manufacturer: fieldSchema,
  address: fieldSchema,
  netQuantity: fieldSchema,
  mrp: fieldSchema,
  mfgDate: fieldSchema,
  consumerCare: fieldSchema,
  countryOfOrigin: fieldSchema,
  fssai: fieldSchema,
});

export type AiLabelExtraction = z.infer<typeof aiSchema>;

const SYSTEM_PROMPT = `You are an expert OCR and Legal Metrology compliance inspection engine for the Legal Metrology (Packaged Commodities) Rules, 2011 (India).
Analyze the packaged commodity label photograph and extract all printed mandatory declarations with maximum precision and accuracy.

STRICT INSTRUCTIONS:
1. ONLY extract text that is literally, visibly printed on the packaging. NEVER assume, extrapolate, or invent values.
2. If a declaration is absent from the packaging, leave its value as null.
3. For each detected field, provide:
   - "text": The complete verbatim phrase as printed (e.g. "MRP ₹145.00 incl. of all taxes", "Net Weight: 500 g", "Mfg Dt: 06/2026", "FSSAI Lic. No. 10014011000214").
   - "x", "y", "w", "h": Normalized bounding box coordinates (floats from 0.0 to 1.0) where (x, y) is the top-left corner, w is width, h is height.
   - "confidence": Float between 0.0 and 1.0 representing detection confidence.
4. "minFontHeightMm": Estimate the printed height in millimeters of the smallest mandatory declaration text on the label (if estimable, otherwise null).
5. "isImported": Set to true if the product is imported into India (e.g. has "Imported by" or foreign manufacturer), false if domestically manufactured.
6. "rawText": Full OCR text transcription of all readable text across the entire packaging surface.

Return ONLY a valid JSON object matching this exact schema:
{
  "productName": string or null,
  "isImported": boolean,
  "minFontHeightMm": number or null,
  "rawText": string,
  "manufacturer": { "text": string, "x": number, "y": number, "w": number, "h": number, "confidence": number } or null,
  "address": { "text": string, "x": number, "y": number, "w": number, "h": number, "confidence": number } or null,
  "netQuantity": { "text": string, "x": number, "y": number, "w": number, "h": number, "confidence": number } or null,
  "mrp": { "text": string, "x": number, "y": number, "w": number, "h": number, "confidence": number } or null,
  "mfgDate": { "text": string, "x": number, "y": number, "w": number, "h": number, "confidence": number } or null,
  "consumerCare": { "text": string, "x": number, "y": number, "w": number, "h": number, "confidence": number } or null,
  "countryOfOrigin": { "text": string, "x": number, "y": number, "w": number, "h": number, "confidence": number } or null,
  "fssai": { "text": string, "x": number, "y": number, "w": number, "h": number, "confidence": number } or null
}`;

function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (match && match[1] && match[2]) {
    const rawMime = match[1].toLowerCase();
    const mimeType = rawMime.includes("png")
      ? "image/png"
      : rawMime.includes("webp")
        ? "image/webp"
        : "image/jpeg";
    return { mimeType, base64: match[2] };
  }
  return {
    mimeType: "image/jpeg",
    base64: dataUrl.replace(/^data:[^,]+,/, ""),
  };
}

/** Extract JSON payload from model response string safely */
function extractAndParseJson(raw: string): AiLabelExtraction {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  return aiSchema.parse(JSON.parse(cleaned));
}

/** Call Gemini Vision API directly */
async function callGeminiVision(
  apiKey: string,
  imageUri: string,
  productNameHint?: string,
): Promise<AiLabelExtraction> {
  const { mimeType, base64 } = parseDataUrl(imageUri);
  const prompt = productNameHint
    ? `${SYSTEM_PROMPT}\n\nNote: The user identified this product as "${productNameHint}". Verify against printed text.`
    : SYSTEM_PROMPT;

  const models = ["gemini-3.6-flash", "gemini-3.7-flash"];
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64 } }],
              },
            ],
            generationConfig: {
              temperature: 0,
              response_mime_type: "application/json",
            },
          }),
        },
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Gemini (${model}) ${res.status}: ${errorText.slice(0, 180)}`);
      }

      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error(`Empty response from Gemini vision (${model}).`);

      return extractAndParseJson(text);
    } catch (err) {
      lastError = err as Error;
    }
  }

  throw lastError || new Error("Failed to process image with Gemini vision.");
}

/** Call OpenAI Vision API (GPT-4o) directly as fallback */
async function callOpenAiVision(
  apiKey: string,
  imageUri: string,
  productNameHint?: string,
): Promise<AiLabelExtraction> {
  const prompt = productNameHint
    ? `${SYSTEM_PROMPT}\n\nNote: The user identified this product as "${productNameHint}". Verify against printed text.`
    : SYSTEM_PROMPT;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUri } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI API ${res.status}: ${errorText.slice(0, 180)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty response from OpenAI vision model.");

  return extractAndParseJson(text);
}

export const extractLabel = createServerFn({ method: "POST" })
  .validator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const geminiKey = process.env["GEMINI_API_KEY"];
    const openaiKey = process.env["OPENAI_API_KEY"];

    if (!geminiKey && !openaiKey) {
      return {
        ok: false as const,
        reason:
          "No AI vision API key configured. Please set GEMINI_API_KEY or OPENAI_API_KEY in .env.",
      };
    }

    let geminiErrorMsg = "";

    // 1. Try Gemini Vision (Primary)
    if (geminiKey) {
      try {
        const parsed = await callGeminiVision(geminiKey, data.image, data.productName);
        return { ok: true as const, data: parsed };
      } catch (geminiError) {
        geminiErrorMsg = (geminiError as Error).message;
        console.warn("Gemini vision attempt failed:", geminiErrorMsg);
      }
    }

    // 2. Try OpenAI Vision (Fallback)
    if (openaiKey) {
      try {
        const parsed = await callOpenAiVision(openaiKey, data.image, data.productName);
        return { ok: true as const, data: parsed };
      } catch (openaiError) {
        const openAiMsg = (openaiError as Error).message;
        console.warn("OpenAI fallback failed:", openAiMsg);
        return {
          ok: false as const,
          reason: geminiErrorMsg
            ? `Gemini Vision Error: ${geminiErrorMsg} | OpenAI Fallback: ${openAiMsg}`
            : `AI vision error: ${openAiMsg}`,
        };
      }
    }

    return {
      ok: false as const,
      reason: `Gemini Vision Error: ${geminiErrorMsg || "Could not process image"}`,
    };
  });
