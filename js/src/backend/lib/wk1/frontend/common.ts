/**
 * Common utilities for the frontend connection pool implementations.
 * 
 * This includes:
 * 1. The connection object {@link Wk1Conn}.
 * 2. A deserialization function.
 * 
 * Dev note 
 * --------
 * 
 * Because this was a spaghetti code-sprint of a protocol, the
 * responsibility of the {@link Wk1Conn} and the underlying
 * pool of connections (implementors of {@link ConnPool}) are
 * braided together. This might be confusing on first read,
 * so let me give an overview:
 * 
 * In a perfect world, the responsibility flow is unidirectional
 * (i.e. the connection pool manages the connections, and the
 * connection code is self-contained). 
 *
 * However, the `close` method of the {@link Conn} interface
 * requires the {@link Wk1Conn} object to have some way of
 * communicating to the pool that the connection is to be
 * hung up.
 * 
 * Therefore, what I did was to register an `onclose` callback
 * onto each {@link Wk1Conn} object, which deals with this
 * criss-crossing of responsibilities. Hidden in `onclose`
 * is the communication with the pool to deregister the connection. 
 * 
 * In other words:
 * ```
 * `ConnPool` implementors are the entry point,
 *            which makes a `Wk1Conn` and an `onclose` callback
 *            holds code pertaining to `Wk1Conn`
 * `Wk1Conn`  holds code that can call `onclose`
 * `onclose`  holds code pertaining to the appropriate
 *            `ConnPool` implementors
 * ```
 */
import * as z from "zod/mini";
import type { Wk1Request, Wk1Response, Wk1ResponseNoConnID } from "../messagetypes";
import type { Conn, RecvMessage } from "../..";

/**
 * A base interface for the frontend that can send messages and
 * subscribe to them.
 *
 * This is basically just a wrapper around `window.postMessage`
 * and `window.onmessage` but seems like it was useful because
 * other JS objects have `.postMessage` and `.onmessage` arguments.
 */

export interface Wk1FrontendBase<R> {
  postMessage(msg: Wk1Request<R>): void;
  onmessage: ((evt: MessageEvent<unknown>) => void) | null;
}

/**
 * A connection object implemented using the Wk1 protocol.
 * 
 * See {@link Conn}.
 * 
 * This class is implemented by subscribing to message events and
 * holding a queue of messages and waiters to balance the number
 * of await calls versus the number of messages available.
 */
export class Wk1Conn implements Conn<unknown, unknown> {
  /**
   * A callback to clean-up traces of this connection from the
   * pool that spawned it. (see module level docs @ `Dev note`)
   */
  private readonly onclose: () => Promise<void>;
  /**
   * A queue of messages received but not awaited on.
   */
  private readonly queue: Wk1ResponseNoConnID[];
  /**
   * A queue of await calls which have not yet resolved
   * with a message.
   */
  private readonly waiters: ((msg: RecvMessage<unknown, unknown>) => void)[];
  /**
   * True if the frontend has deliberately closed this connection.
   */
  private closed;

  /**
   * Make a {@link Wk1Conn}.
   * 
   * @param onclose - A callback to clean-up traces of this connection
   *                  from the pool that spawned it.
   *                  (see module level docs @ `Dev note`)
   */
  constructor(
    onclose: () => Promise<void>,
  ) {
    this.onclose = onclose;
    this.queue = [];
    this.waiters = [];
    this.closed = false;
  }

  /**
   * @inheritdoc Conn.recv
   */
  async recv(): Promise<RecvMessage<unknown, unknown>> {
    if (this.closed) return { case: "error", reason: "connection closed" };
    while (this.queue.length > 0) {
      const msg = this.convertMessage(this.queue.shift()!);
      if (msg !== null) return msg;
    }
    return new Promise((resolve) => this.waiters.push(resolve));
  }

  /**
   * @inheritdoc Conn.recv
   */
  close(): Promise<void> {
    this.closed = true;
    this.waiters.forEach((waiter) =>
      waiter({ case: "error", reason: "connection closed" })
    );
    void this.queue.splice(0);
    void this.waiters.splice(0);
    return this.onclose();
  }

  /**
   * @private
   * 
   * Resolves the first waiter waiting on this message,
   * or puts it in the queue if there are not waiters.
   * 
   * This should be a private method but needs to be accesible
   * to various connection pool classes in this file.
   */
  onmessage(msg: Wk1ResponseNoConnID) {
    if (this.closed) return;
    if (this.waiters.length > 0) {
      const msg_ = this.convertMessage(msg);
      if (msg_ === null) return;
      const waiter = this.waiters.shift()!;
      waiter(msg_);
    } else {
      this.queue.push(msg);
    }
  }

  /**
   * @private
   * 
   * Convert a {@link Wk1Response} to a {@link RecvMessage}.
   * 
   * Used in taking messages received from the backend and
   * turning them into messages that waiters can resolve on.
   * 
   * @param msg - Message from backend.
   * @returns - Message to be returned to frontend waiter.
   */
  private convertMessage(
    msg: Wk1ResponseNoConnID 
  ): RecvMessage<unknown, unknown> | null {
    if (this.closed || msg.case === "ack/hup")
      return { case: "error", reason: "connection closed" };
    return msg.case === "ack/syn" ? null : msg;
  }
}

/**
 * Deserializes an arbitrary message (the type that comes from
 * `window.onmessage`) to a `Wk1Response`.
 * 
 * @param data - Message received from backend.
 * @returns - Object following the `Wk1Response` schema.
 * 
 * I type messages received from backend as `unknown`, and this is
 * used to type check those messages.
 */
export function deserializeWk1Response(data: unknown): Wk1Response {
  const parsed = Wk1ResponseSchema.safeParse(data)
  if (parsed.success) {
    return parsed.data
  }
  return {
    case: "error",
    connID: null,
    reason: `unrecognized response format: ${parsed.error}`
  }
}

/**
 * Schema for {@link Wk1Response} without constraint on the
 * type of data in "yield" and "close" methods.
 */
const Wk1ResponseSchema = z.discriminatedUnion("case", [
  z.object({ case: z.literal("ack/syn"), connID: z.string() }),
  z.object({ case: z.literal("ack/hup"), connID: z.string() }),
  z.object({ case: z.literal("yield"), connID: z.string(), data: z.unknown() }),
  z.object({ case: z.literal("close"), connID: z.string(), data: z.unknown() }),
  z.object({ case: z.literal("error"), connID: z.nullable(z.string()), reason: z.string() })
]);