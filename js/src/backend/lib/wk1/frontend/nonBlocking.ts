/** Module defining {@link Wk1NBPool}. */
import type { Wk1Response } from "../messagetypes";
import type { Wk1FrontendBase } from "./common";
import type { ConnPool, SynMessage } from "../..";
import { deserializeWk1Response, Wk1Conn } from "./common";

/**
 * A connection pool for non-blocking requests
 * (hence the name `Wk1(NonBlocking)Pool`).
 * 
 * This class wraps a single {@link Wk1FrontendBase}.
 * 
 * The backend behind this base is expected to be responsive
 * to new messages (and therefore cannot be caught up in
 * blocking work).
 * 
 * Technically, failing to meet this assumption will not result
 * in breaking behaviour. Instead, this class will effectively
 * become a more expensive version of a blocking pool.
 * 
 * Dev note
 * --------
 * 
 * This pool class has three responsibilities:
 * 1. Spawn a connection by sending a message to the base and
 *    registering a message handler for that connection.
 * 2. Provide the `onclose` handler that sends hang-up messages
 *    for each connection to the base.
 * 3. De-register a message handler after a "close", "error", or
 *    "ack/hup" message is received.
 * 
 * The corresponding methods for those responsibilities are as follows:
 * 1. {@link Wk1NBPool.post}
 * 2. {@link Wk1NBPool.onclose}
 * 3. {@link Wk1NBPool.onmessage}
 */
export class Wk1NBPool<R> implements ConnPool<R, unknown, unknown> {
  /**
   * Inner message sender and handler.
   * This is expected to be a unique reference to this object.
   */
  private readonly base: Wk1FrontendBase<R>;
  /** Generator of new connection IDs. */
  private readonly genID: () => string;
  /** Map of message handlers for each connection ID. */
  private readonly handlerMap: Map<string, (_: Wk1Response<unknown, unknown>) => void>;

  /**
   * Make a new {@link Wk1NBPool}.
   * 
   * @param base - Inner message sender and handler.
   *               This is expected to be a unique reference
   *               to this object.
   * @param genID - Generator of new connection IDs.
   */
  constructor(base: Wk1FrontendBase<R>, genID: () => string) {
    base.onmessage = (evt) => this.onmessage(deserializeWk1Response(evt.data));
    this.base = base;
    this.genID = genID;
    this.handlerMap = new Map();
  }
 
  /**
   * @inheritdoc ConnPool.post
   * 
   * @returns - Resolves when an "ack/syn" message is received.
   * 
   * @throws - Rejects on receiving other types of messages with
   *           the specified connection ID.
   */
  async post(msg: SynMessage<R>): Promise<Wk1Conn> {
    let connID = this.genID();
    for (; ; connID = this.genID()) {
      if (!this.handlerMap.has(connID)) break;
    }
    const self = this;
    const conn = new Wk1Conn(
      () => self.onclose(connID),
    );
    let waiters: [() => void, (_: Error) => void];
    const acknowledged = new Promise<void>(
      (resolve, reject) => (waiters = [resolve, reject])
    );
    this.handlerMap.set(connID, (m) => {
      const [resolve, reject] = waiters;
      if (m.case === "ack/syn") {
        resolve();
      } else {
        const reason =
          m.case === "error"
            ? m.reason
            : `received invalid response to syn: ${JSON.stringify(m)}`;
        reject(new Error(`[Wk1NBPool post] ${reason}`));
      }
    });
    this.base.postMessage({ case: "syn", data: msg.data, connID });
    await acknowledged;
    this.handlerMap.set(connID, (m) => conn.onmessage(m));
    return conn;
  }

  /**
   * Close the connection with this ID prematurely, sending a
   * hang-up message and waiting for the message to be
   * acknowledged.
   * 
   * @param connID - The connection ID to hang up.
   * 
   * This method is not responsible for removing the connection
   * from the table. That automatically happens in {@link Wk1NBPool.onmessage}.
   */
  private async onclose(connID: string) {
    const handler = this.handlerMap.get(connID);
    if (handler !== undefined) {
      let waiters: [() => void, (_: Error) => void];
      const acknowledged = new Promise<void>(
        (resolve, reject) => (waiters = [resolve, reject])
      );
      this.handlerMap.set(connID, (m) => {
        const [resolve, reject] = waiters;
        if (m.case === "ack/hup" || m.case === "close") {
          resolve();
        }
        if (m.case === "error") {
          reject(
            new Error(
              `[Wk1NBPool onclose] failed to gracefully hang up: ${m.reason}`
            )
          );
          handler(m);
        }
      });
      this.base.postMessage({ case: "hup", connID });
      await acknowledged;
    }
  }

  /**
   * Message handler for a message from any connection.
   * 
   * @param msg - The message received from the backend.
   * 
   * This method routes the message to the correction connection
   * handler, and de-registers the connection handler if the
   * received message is of case "ack/hup", "close", or "error".
   */
  private onmessage(msg: Wk1Response) {
    if (msg.connID === null) {
      if (msg.case !== "error")
        throw new Error(`[Wk1NBPool onmessage] unreachable`);
      for (const handler of this.handlerMap.values()) {
        // This is queued instead of called directly so that
        // if one of these crashes we still schedule
        // all of them.
        queueMicrotask(() => handler(msg));
      }
      this.handlerMap.clear();
      return;
    }
    const handler = this.handlerMap.get(msg.connID);
    if (handler === undefined) {
      if (
        msg.case === "close" ||
        msg.case === "ack/hup" ||
        msg.case === "error"
      ) {
        return;
      }
      this.base.postMessage({ case: "hup", connID: msg.connID });
      return;
    }
    if (
      msg.case === "error" ||
      msg.case === "close" ||
      msg.case === "ack/hup"
    ) {
      this.handlerMap.delete(msg.connID);
    }
    handler(msg);
  }
}