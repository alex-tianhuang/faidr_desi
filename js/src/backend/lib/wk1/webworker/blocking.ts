/**
 * Module defining the {@link BLKBackend} function.
 */
import type { Wk1Response } from "../messagetypes";
import { deserializeWk1Request, type RecvMessage, type SynMessage, type Wk1BackendBase } from "./common";

/**
 * Boilerplate for a single-threaded backend
 * that is allowed to block for long periods of time.
 * 
 * This backend can only handle one connection at a time.
 * 
 * This type of backend is most appropriate for doing compute work.
 */
export async function BLKBackend(
  base: Wk1BackendBase,
  args: {
    initServer: (
      recvToServer: () => Promise<SynMessage<unknown>>,
      sendFromServer: (msg: RecvMessage<unknown>) => Promise<void>
    ) => Promise<void>;
  }
) {
  const { initServer } = args;
  let terminated = false;
  let activeConn: ActiveConn | null = null;
  let waiters: [(data: SynMessage<unknown>) => void, (_: Error) => void] | null =
    null;
  const recvToServer = () => {
    if (waiters !== null)
      throw new Error(
        `[BLKBackend recvToServer] assertion failed, server awaited next request twice`
      );
    if (activeConn?.hup) {
      activeConn = null;
    }
    if (activeConn !== null && !activeConn.sent) {
      const {connID, data} = activeConn;
      activeConn = {
        connID,
        hup: false,
        sent: true
      };
      return Promise.resolve({
        data,
        connID: activeConn.connID,
      });
    } else {
      return new Promise<SynMessage<unknown>>((resolve, reject) => {
        waiters = [resolve, reject];
      });
    }
  };
  const sendFromServer = async (msg: RecvMessage<unknown>) => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    if (msg.connID !== activeConn?.connID) {
      const reason = "connection unexpectedly changed in server";
      base.postMessage({
        case: "error",
        reason,
        connID: msg.connID,
      });
      if (activeConn !== null) {
        base.postMessage({
          case: "error",
          reason,
          connID: activeConn.connID,
        });
      }
      activeConn = null;
      throw new Error(reason);
    }
    if (activeConn.hup) {
      const reason = "connection dropped by frontend";
      activeConn = null;
      throw new Error(reason);
    }
    base.postMessage(msg satisfies Wk1Response);
    if (msg.case === "error" || msg.case === "close") {
      activeConn = null;
    }
  };
  const sendToServer: (msg: SynMessage<unknown>) => Wk1Response = (
    msg: SynMessage<unknown>
  ) => {
    if (activeConn !== null) {
      return activeConn.connID === msg.connID
        ? {
            case: "ack/syn",
            connID: msg.connID,
          }
        : {
            case: "error",
            connID: msg.connID,
            reason: "already running other job",
          };
    }
    if (waiters === null) {
      activeConn = {
        connID: msg.connID,
        hup: false,
        sent: false,
        data: msg.data,
      };
    } else {
      const [resolve, _] = waiters;
      resolve({ data: msg.data, connID: msg.connID });
      waiters = null;
      activeConn = {
        connID: msg.connID,
        hup: false,
        sent: true
      };
    }
    return {
      case: "ack/syn",
      connID: msg.connID,
    };
  };
  void initServer(recvToServer, sendFromServer)
    .catch((error) => {
      console.error("[BLKBackend] backend crashed: ", error);
      const reason = error instanceof Error ? error.message : `${error}`;
      base.postMessage({
        case: "error",
        connID: null,
        reason,
      });
      if (waiters !== null) {
        const [_, reject] = waiters;
        waiters = null;
        reject(new Error(reason));
      }
    })
    .finally(() => (terminated = true));
  base.onmessage = (evt) => {
    const parsed = deserializeWk1Request(evt.data);
    if (!parsed.success) {
      console.error(
        "[BLKBackend] unknown message format received",
        parsed.error,
        evt.data
      );
      return;
    }
    const msg = parsed.data;
    if (terminated) {
      return { case: "error", connID: msg.connID, reason: "server terminated" };
    }
    if (msg.case === "hup") {
      if (activeConn !== null && activeConn.connID === msg.connID) {
        activeConn.hup = true;
      }
      base.postMessage({
        case: "ack/hup",
        connID: msg.connID,
      });
    }
    if (msg.case === "syn") {
      const outgoing = sendToServer(msg);
      base.postMessage(outgoing);
    }
  };
}
/**
 * Helper type representing the state of the active connection.
 */
type ActiveConn = {
  connID: string;
  hup: boolean;
} & ({
  sent: true;
} | {
  sent: false;
  data: unknown
});