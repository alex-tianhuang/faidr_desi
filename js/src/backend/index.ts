import { useEffect } from "react";
import { communicate, type RecvMessage as GenericRecvMessage } from "./framework";
import { Wk1NBPool } from "./framework/wk1";
import Worker from "./wk1NB.ts?worker";
const pool = new Wk1NBPool(new Worker(), () => crypto.randomUUID());
/** 
 * Make a request to the backend and cancel on unmount.
 */ 
export function useBackend(args: {
  msg: unknown;
  body: (recv: () => Promise<RecvMessage>) => Promise<void>;
  setup: () => void;
  deps: unknown[];
}) {
  const { msg, body, setup, deps } = args;
  useEffect(() => {
    setup();
    const [unmounted, unmount] = unmountCallbacks();
    void communicate(
      pool,
      {
        data: msg,
      },
      (rawRecv) => {
        if (unmounted()) return Promise.resolve();
        const guardedRecv = async () => {
          const msg = await rawRecv();
          if (unmounted()) {
            return { case: "unmounted" as const }
          } else {
            return msg
          }
        }
        return body(guardedRecv)
      },
    );
    return unmount
  }, deps);
}
/** Response type, including unmount checks. */
export type RecvMessage = GenericRecvMessage<unknown, unknown> | { case: "unmounted" }
/** Some boilerplate for unmount checks. */
function unmountCallbacks() {
  const controller = new AbortController()
  const signal = controller.signal;
  const unmounted = () => signal.aborted;
  const unmount = () => controller.abort();
  return [unmounted, unmount] as const
}