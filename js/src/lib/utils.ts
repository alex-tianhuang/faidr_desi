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
