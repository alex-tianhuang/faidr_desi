/** Module defining {@link Wk1BLKPool}. */
import type { Wk1Response } from "../messagetypes";
import type { Wk1FrontendBase } from "./common";
import type { Conn, ConnPool, SynMessage } from "../..";
import { deserializeWk1Response, Wk1Conn } from "./common";

/**
 * A connection pool for blocking requests
 * (hence the name `Wk1(BLocKing)Pool`).
 * 
 * This class wraps multiple {@link Wk1FrontendBase}s.
 * 
 * The backends behind these bases are assumed to be single-threaded
 * event loops that may become unresponsive for long periods of time
 * due to a long, blocking compute task. Therefore, the frontend
 * keeps track of the active connection and never attempts to send
 * more than one request per worker at a time.
 * 
 * Dev note
 * --------
 * 
 * Since this is managing a lot of independently operating {@link Wk1FrontendBase}s,
 * most of the logic lives in the {@link Wk1BlockingWorker} class.
 * 
 * The responsibility of this class then is to act as a wrapper which
 * holds the workers and a shared queue among workers.
 */
export class Wk1BLKPool<R> implements ConnPool<R, unknown, unknown> {
  /** Queue of work entries, which each wrap a {@link Wk1BLKPool.post} request. */
  private readonly queue: Wk1BLKPost<R>[]
  /** Workers, which each wrap a {@link Wk1FrontendBase}. */
  private readonly workers: Wk1BlockingWorker<R>[]
  /** Make a `Wk1BLKPool` from the following communication bases. */
  constructor(bases: Wk1FrontendBase<R>[], genID: () => string) {
    this.queue = [];
    this.workers = bases.map(base => new Wk1BlockingWorker(base, this.queue, genID));
  }
  /**
   * @inheritdoc ConnPool.post
   *
   * @returns - Resolves when an "ack/syn" message is received.
   *            This means the promise will suspend until
   *            the job is taken from the queue by a worker.
   * 
   * @throws - Rejects on receiving other types of messages with
   *           the specified connection ID.
   */
  async post(msg: SynMessage<R>): Promise<Conn<unknown, unknown>> {
    let waiters: [(_: Conn<unknown, unknown>) => void, (_: Error) => void];
    const promise = new Promise<Conn<unknown, unknown>>((resolve, reject) => {
      waiters = [resolve, reject]
    }) 
    const work = {msg, waiters: waiters!}
    this.queue.push(work)
    for (const worker of this.workers) {
      if (worker.isFree()) {
        worker.consumeWork();
        break;
      }
    }
    return promise
  }
  /**
   * Number of workers in this pool.
   */
  size(): number {
    return this.workers.length
  }
}
/**
 * Wrapper for a base that is backed by a single-threaded backend
 * that may become unresponsive due to long periods of blocking.
 *
 * Dev note
 * --------
 * 
 * This worker manages an active connection and gets new work from the
 * shared queue at {@link Wk1BlockingWorker.poolQueue}.
 * 
 * It has the following responsibilities:
 * 1. Spawn a connection by sending a message to the base and
 *    setting the active connection to be that connection.
 * 2. Provide the `onclose` handler that sends hang-up messages
 *    for each connection to the base.
 * 3. Close the active connection after a "close", "error", or
 *    "ack/hup" message is received. Also take new work if available.
 * 
 * The corresponding methods for those responsibilities are as follows:
 * 1. {@link Wk1BlockingWorker.consumeWork}
 * 2. {@link Wk1BlockingWorker.onclose}
 * 3. {@link Wk1BlockingWorker.onmessage}
 */
class Wk1BlockingWorker<R> {
  private readonly base: Wk1FrontendBase<R>
  private readonly poolQueue: Wk1BLKPost<R>[]
  private readonly genID: () => string;
  private active: ActiveConn<R> | null;
  constructor(base: Wk1FrontendBase<R>, poolQueue: Wk1BLKPost<R>[], genID: () => string, ) {
    base.onmessage = (evt) => this.onmessage(deserializeWk1Response(evt.data))
    this.base = base;
    this.poolQueue = poolQueue;
    this.genID = genID;
    this.active = null
  }
  /**
   * If this worker is free, take the next `Wk1BLKPost`
   * from the queue and begin to work on it.
   */
  consumeWork() {
    if (this.active !== null) return;
    const work = this.poolQueue.shift()
    if (work === undefined) return;
    const connID = this.genID();
    const conn = new Wk1Conn(() => this.onclose(connID));
    this.active = {
      waiters: work.waiters,
      conn,
      connID
    }
    this.base.postMessage({ case: "syn", connID, ...work.msg })
  }
  /** True if this worker is not working on an active connection. */
  isFree() {
    return this.active === null
  }
  /**
   * @private
   * 
   * Message handler.
   * 
   * @param msg - The message received from backend.
   */
  private onmessage(msg: Wk1Response) {
    if (msg.connID === null) {
      if (msg.case !== "error")
        throw new Error(`[Wk1BlockingWorker onmessage] unreachable`);
      this.active?.conn.onmessage(msg);
      this.active = null;
      this.consumeWork();
      return;
    }
    if (msg.connID !== this.active?.connID) {
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
    const active = this.active;
    if (
      msg.case === "error" ||
      msg.case === "close" ||
      msg.case === "ack/hup"
    ) {
      this.active = null;
      this.consumeWork();
    }
    if (active.waiters !== null) {
      const [resolve, reject] = active.waiters;
      active.waiters = null;
      if (msg.case === "ack/syn") {
        resolve(active.conn);
      } else {
        const reason =
          msg.case === "error"
            ? msg.reason
            : `received invalid response to syn: ${JSON.stringify(msg)}`;
        reject(new Error(`[Wk1BlockingWorker onmessage] ${reason}`));
      }
      return;
    }
    active.conn.onmessage(msg);
  }
  /**
   * @private
   * 
   * Close the active connection if it is still this connection ID.
   * 
   * @param connID - Connection ID to close.
   */
  private async onclose(connID: string): Promise<void> {
    if (connID === this.active?.connID) {
      let waiters: [() => void, (_: Error) => void];
      const acknowledged = new Promise<void>((resolve, reject) => {
        waiters = [resolve, reject]
      });
      this.base.onmessage = (evt) => {
        const m = deserializeWk1Response(evt.data);
        const [resolve, reject] = waiters;
        if (m.connID !== connID) {
          this.onmessage(m);
          return;
        }
        if (m.case === "ack/hup" || m.case === "close") {
          resolve();
        }
        if (m.case === "error") {
          reject(
            new Error(
              `[Wk1BlockingWorker onclose] failed to gracefully hang up: ${m.reason}`
            )
          );
          this.onmessage(m);
        }
      }
      try {
        this.base.postMessage({ case: "hup", connID });
        await acknowledged;
      } finally {
        this.base.onmessage = (evt) => this.onmessage(deserializeWk1Response(evt.data));
      }
      if (this.active?.connID === connID) {
        this.active = null;
        this.consumeWork()
      }
    }
  }
}
/**
 * Helper struct for the blocking backend {@link Wk1BlockingWorker}.
 */
type ActiveConn<R> = {
  /**
   * Active connection ID.
   */
  connID: string;
  /**
   * Active connection. Used to register messages.
   */
  conn: Wk1Conn;
  /**
   * Callbacks to resolve the {@link Wk1BLKPool.post} promise.
   * If the promise is already resolved (i.e. the first message
   * has been received), this is null.
   */
  waiters: Wk1BLKPost<R>["waiters"] | null;
}
/**
 * Helper struct for the blocking backend {@link Wk1BlockingWorker}.
 * 
 * Consists of a pair of callbacks that resolve/reject the
 * {@link ConnPool.post} promise, and the message to send to the backend.
 */
type Wk1BLKPost<R> = {
  /**
   * Message that {@link Wk1BLKPool.post} was called with.
   */
  msg: SynMessage<R>;
  /**
   * Pair of callbacks that will resolve/reject the call to
   * {@link ConnPool.post}.
   */
  waiters: [(_: Conn<unknown, unknown>) => void, (_: Error) => void]
}
