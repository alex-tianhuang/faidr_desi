/**
 * Module defining the {@link NBBackend} function.
 */
import { communicate, type ConnPool } from "../..";
import type { ResponseWithWorkerID } from "../frontend/batched";
import {
  type Wk1BackendBase,
  type RecvMessage,
  type SynMessage,
  type RecvMessageNoConnID,
  type SynMessageNoConnID,
  deserializeWk1Request,
} from "./common";

/**
 * Boilerplate for a non-blocking (responsive) backend,
 * which is assumed to have its own connection pool for spawning
 * possibly blocking tasks.
 * 
 * This type of backend is most appropriate for coordinating large
 * amounts of async work.
 * 
 * @param base - The window object which will be receiving requests
 *               and sending repsonses.
 * @param initServer - A server initialization function that takes
 *                     three callbacks (see below).
 * @param taskPool - A connection pool ({@link ConnPool}) that is be
 *                   used to delegate subtasks that would block.
 * 
 * initServer
 * ----------
 * The server initialization function has access to three JS callbacks:
 * 
 * @param recvToServer - Calling this function will suspend waiting for
 *                       the next {@link SynMessage}.
 * @param sendFromServer - Calling this function with a message will
 *                         suspend until that message sends or an error is thrown.
 * @param spawnTask - Calling this function will send a batched message to a sub-worker,
 *                    and call the `body` handler upon connecting to sub-workers.
 */
export async function NBBackend(
  base: Wk1BackendBase,
  initServer: (
    recvToServer: () => Promise<SynMessage<unknown>>,
    sendFromServer: (msg: RecvMessage<unknown>) => Promise<void>,
    spawnTask: (
      msg: SynMessageNoConnID<unknown[]>,
      body: (recv: () => Promise<RecvMessageNoConnID<ResponseWithWorkerID>>) => Promise<void>
    ) => Promise<void>
  ) => Promise<void>,
  taskPool: ConnPool<unknown[], ResponseWithWorkerID, ResponseWithWorkerID>
) {
  const connHupTable: Map<string, boolean> = new Map();
  const serverSendQueue: { connID: string; data: unknown }[] = [];
  let terminated = false;
  let waiters: [(data: SynMessage<unknown>) => void, (_: Error) => void] | null = null;
  const recvToServer = () => {
    if (waiters !== null)
      throw new Error(
        `[NBBackend recvToServer] assertion failed, server awaited next request twice`
      );
    while (serverSendQueue.length > 0) {
      const { connID, data } = serverSendQueue.shift()!;
      const isHup = connHupTable.get(connID);
      if (isHup === undefined)
        throw new Error(`[NBBackend recvToServer] assertion failed`);
      if (isHup) {
        connHupTable.delete(connID);
        continue;
      }
      return Promise.resolve({
        data,
        connID,
      });
    }
    return new Promise<SynMessage<unknown>>((resolve, reject) => {
      waiters = [resolve, reject];
    });
  };
  const sendFromServer = async (msg: RecvMessage<unknown>) => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    const connID = msg.connID;
    const isHup = connHupTable.get(msg.connID);
    if (isHup === undefined) {
      const reason = "connection unexpectedly dropped by server";
      base.postMessage({
        case: "error",
        reason,
        connID: msg.connID,
      });
      throw new Error(reason);
    }
    if (isHup) {
      const reason = "connection dropped by frontend";
      connHupTable.delete(connID);
      throw new Error(reason);
    }
    base.postMessage(msg);
    if (msg.case === "error" || msg.case === "close") {
      connHupTable.delete(connID);
    }
  };
  const sendToServer = (msg: SynMessage<unknown>) => {
    connHupTable.set(msg.connID, false);
    if (waiters === null) {
      serverSendQueue.push({
        connID: msg.connID,
        data: msg.data,
      });
    } else {
      const [resolve, _] = waiters;
      resolve({ data: msg.data, connID: msg.connID });
      waiters = null;
    }
  };
  const spawnTask = (
    msg: SynMessageNoConnID<unknown[]>,
    body: (_: () => Promise<RecvMessageNoConnID<ResponseWithWorkerID>>) => Promise<void>
  ) => communicate(taskPool, msg, body);
  void initServer(recvToServer, sendFromServer, spawnTask)
    .catch((error) => {
      const reason = error instanceof Error ? error.message : `${error}`;
      console.error("[NBBackend] backend crashed: ", error);
      base.postMessage({
        case: "error",
        connID: null,
        reason: reason,
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
        "[NBBackend] unknown message format received",
        parsed.error,
        evt.data
      );
      return;
    }
    const msg = parsed.data;
    if (terminated) {
      base.postMessage({
        case: "error",
        connID: msg.connID,
        reason: "server terminated",
      });
      return;
    }
    if (msg.case === "syn") {
      sendToServer(msg);
      base.postMessage({
        case: "ack/syn",
        connID: msg.connID,
      });
    }
    if (msg.case === "hup") {
      const connID = msg.connID;
      if (connHupTable.has(connID)) {
        connHupTable.set(connID, true);
      }
      base.postMessage({
        case: "ack/hup",
        connID,
      });
    }
  };
}
