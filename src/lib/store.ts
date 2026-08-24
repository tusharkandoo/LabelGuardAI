import type { Inspection, Officer } from "./types";
import { demoInspections } from "./demo-data";

const KEY = "labelguard.inspections.v1";
const OFFICER_KEY = "labelguard.officer.v1";
const OLD_KEY = "packsure.inspections.v1";
const OLD_OFFICER_KEY = "packsure.officer.v1";

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadInspections(): Inspection[] {
  if (!isBrowser()) return [];
  try {
    let raw = window.localStorage.getItem(KEY);
    if (!raw) {
      // Migrate old data if present
      const oldRaw = window.localStorage.getItem(OLD_KEY);
      if (oldRaw) {
        raw = oldRaw;
        window.localStorage.setItem(KEY, oldRaw);
      } else {
        window.localStorage.setItem(KEY, JSON.stringify(demoInspections));
        return demoInspections;
      }
    }
    return JSON.parse(raw) as Inspection[];
  } catch {
    return demoInspections;
  }
}

export function saveInspections(list: Inspection[]) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* quota — keep the newest 20 only */
    try {
      window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, 20)));
    } catch {
      /* ignore */
    }
  }
  window.dispatchEvent(new Event("labelguard:updated"));
}

export function upsertInspection(inspection: Inspection) {
  const list = loadInspections();
  const idx = list.findIndex((i) => i.id === inspection.id);
  if (idx >= 0) list[idx] = inspection;
  else list.unshift(inspection);
  saveInspections(list);
}

export function getInspection(id: string): Inspection | undefined {
  return loadInspections().find((i) => i.id === id);
}

export function nextInspectionId(): string {
  const year = new Date().getFullYear();
  const highest = loadInspections().reduce((max, i) => {
    const n = Number(i.id.split("-").pop());
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  return `LM-${year}-${String(highest + 1).padStart(4, "0")}`;
}

/** Stable fingerprint of an image data URL, used to recognise a re-scan of the same photo. */
export function imageFingerprint(dataUrl: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < dataUrl.length; i++) {
    const c = dataUrl.charCodeAt(i);
    h1 = ((h1 ^ c) * 16777619) >>> 0;
    h2 = (h2 + c * (i + 1)) >>> 0;
  }
  return `${h1.toString(16)}${h2.toString(16)}-${dataUrl.length.toString(16)}`;
}

export function findByImageHash(hash: string): Inspection | undefined {
  return loadInspections().find((i) => i.imageHash === hash);
}

export function loadOfficer(): Officer | null {
  if (!isBrowser()) return null;
  try {
    let raw = window.localStorage.getItem(OFFICER_KEY);
    if (!raw) {
      const oldRaw = window.localStorage.getItem(OLD_OFFICER_KEY);
      if (oldRaw) {
        raw = oldRaw;
        window.localStorage.setItem(OFFICER_KEY, oldRaw);
      }
    }
    return raw ? (JSON.parse(raw) as Officer) : null;
  } catch {
    return null;
  }
}

export function saveOfficer(officer: Officer) {
  if (!isBrowser()) return;
  window.localStorage.setItem(OFFICER_KEY, JSON.stringify(officer));
}

export function clearOfficer() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(OFFICER_KEY);
}
