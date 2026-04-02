import type { Featurized } from "@/features/featurize/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export type Mutation = {
  from: string;
  to: string;
  pos: number;
};
/** Turn a `Mutation` (above) to text. */
export function mutationToString(mutation: Mutation) {
  const { from, to, pos } = mutation;
  return `${from}${pos + 1}${to}`;
}
/** File writing function written by Claude Code. */
export async function saveFile(content: string, suggestedName: string) {
  if ("showSaveFilePicker" in window) {
    const handle = await (window as any).showSaveFilePicker({
      suggestedName,
      types: [{ description: "CSV file", accept: { "text/csv": [".csv"] } }],
    });
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
  } else {
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = suggestedName;
    a.click();
    URL.revokeObjectURL(url);
  }
};
/** CompareFn for `Array.sort` */
export function compareStrings(a: string, b: string) {
  return a > b ? 1 : (a < b ? -1 : 0)
}
/** Format the time elapsed from `Date.now()` differences. */
export function formatTimeElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
};

/** Check that all features are non-error variants. */
export function checkAllFeatures(data: Record<string, Featurized> | null) {
  if (data === null) {
    return {
      featureVector: null,
      checkError: null,
    };
  }
  const featureVector: Record<string, number> = {};
  for (const [featureID, featurized] of Object.entries(data)) {
    if (featurized.case === "error") {
      return {
        featureVector: null,
        checkError: featurized.value.reason,
      };
    }
    featureVector[featureID] = featurized.value;
  }
  return {
    featureVector,
    checkError: null,
  };
}
/**
 * Paste to clipboard, even in an `http` server.
 * Written by Claude Code.
 */
export function copyToClipboard(text: string) {
  // Modern API
  if (navigator.clipboard && window.isSecureContext) {
    try {
      navigator.clipboard.writeText(text);
      return;
    } catch (err) {
      // console.warn('Clipboard API failed:', err);
    }
  }

  // Fallback for HTTP or older browsers
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand('copy'); // deprecated but widely supported
  } finally {
    document.body.removeChild(textarea);
  }
}