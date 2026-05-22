/**
 * Test harness entry point, written by Claude.
 *
 * Boots the real worker topology (wk1NB → wk1BLK pool) and exposes
 * `window.__communicate` for Playwright to drive via `page.evaluate`.
 */
import { v4 as uuidv4 } from "uuid";
import { communicate } from "@/backend/lib";
import { Wk1NBPool } from "@/backend/lib/wk1";
import NBWorker from "@/backend/wk1NB.ts?worker";
import initWasm, * as rustModule from "@/backend/rust/idrdesign_app";

const pool = new Wk1NBPool(new NBWorker(), uuidv4);

/**
 * Result shape returned from `window.__communicate`.
 *
 * JSON-serializable so it survives the Playwright page.evaluate boundary.
 */
type HarnessResult = {
  yielded: unknown[];
  closed: unknown | null;
  error: string | null;
};

/**
 * Drive one request through `communicate` and collect all messages.
 *
 * Playwright calls this via:
 *   const result = await page.evaluate(msg => window.__communicate(msg), msg)
 */
async function runCommunicate(msg: unknown): Promise<HarnessResult> {
  const yielded: unknown[] = [];
  let closed: unknown | null = null;
  let error: string | null = null;

  await communicate(pool, { data: msg }, async (recv) => {
    while (true) {
      const m = await recv();
      if (m.case === "yield") {
        yielded.push(m.data);
      } else if (m.case === "close") {
        closed = m.data;
        break;
      } else if (m.case === "error") {
        error = m.reason;
        break;
      }
    }
  });

  return { yielded, closed, error };
}

// Expose to Playwright and signal readiness.
declare global {
  interface Window {
    __communicate: (msg: unknown) => Promise<HarnessResult>;
    __rust: Promise<typeof rustModule>;
    __ready: boolean;
  }
}

window.__communicate = runCommunicate;
window.__rust = initWasm().then(() => rustModule)
window.__ready = true;