/**
 * @module backend/framework
 * 
 * The types and interfaces used to communicate with a computational backend.
 * The framework assumes that one message is sent from the frontend, resulting
 * in a single or multiple message(s) from the backend.
 * 
 * Overview
 * --------
 * 
 * The interfaces {@link SynMessage} and {@link RecvMessage} describe the
 * expected format of messages.
 * 
 * For frontend developers, look at {@link communicate} as the main method
 * of interacting with the backend. You will also need something that
 * implements {@link ConnPool}, although the implementation of this object
 * is something for the backend/adapter people.
 * 
 * For backend developers, look at implementing interfaces {@link ConnPool}
 * and {@link Conn}.
 * 
 * What is not specified
 * ---------------------
 * The framework in this file does not specify the valid formats of
 * messages to be passed.
 */

/**
 * Input (SYNchronizing) message, sent from frontend to backend.
 * 
 * After documenting this module, it looks a little redundant to have
 * an object which stores a data field instead of just the data itself.
 * 
 * Perhaps in the future requests will specify what resources they require
 * and all of a sudden more fields will be added to the SynMessage, and
 * this presently strange indirection will become useful.
 * 
 * For now, the reason this is like this is because this is how I wrote
 * it and I feel no need to change it at the moment.
 */
export type SynMessage<R> = { data: R };

/**
 * Output (RECeiVed) message, sent from backend to frontend.
 * 
 * This is a tagged enum by the field "case":
 * ```
 * "yield" => indicating a non-terminal message (i.e. incremental progress)
 * "close" => indicating a terminal message where the backend/communication
 *            understood the request and handled it accordingly
 * "error" => indicating a terminal message where the backend/communication
 *            failed for some reason or other to understand or respond
 *            to the request
 * ```
 * 
 * When to use case: "error"
 * -------------------------
 * 
 * I attempt to keep a distinction between errors due to backend/communication
 * failure and other errors.
 * 
 * If the backend crashes for some reason or an unrecognized JSON message is posted
 * that the backend doesn't support, that falls in the "error" case.
 * 
 * If the user enters in some junk sequences or bad feature sets but the underlying
 * communication and backend are healthy, that falls in the "close" case (with
 * the user input error specified in the response "data" object).
 */
export type RecvMessage<S, T> =
  | { case: "yield"; data: S }
  | { case: "close"; data: T }
  | { case: "error"; reason: string };

/**
 * Represents a handle to a pool of connections (see {@link Conn}).
 * 
 * You can think of this like a handle to a threadpool or some
 * other form of worker running parallel to the main thread.
 * 
 * Used with {@link communicate}.
 */
export interface ConnPool<R, S, T> {
  /**
   * Obtain a new connection that will handle the request
   * specified by the `msg` argument.
   * 
   * @param msg - The request for the backend to handle.
   */
  post(msg: SynMessage<R>): Promise<Conn<S, T>>;
}

/**
 * Represents one active connection to a compute backend running
 * in parallel to the main thread.
 * 
 * Frontend users should never have to touch this type directly,
 * instead using {@link communicate}.
 */
export interface Conn<S, T> {
  /**
   * Call this to await the next message if one exists.
   * 
   * Terminal messages
   * -----------------
   * 
   * It can be assumed by the frontend and backend that
   * upon receiving a `RecvMessage` of type "close" or "error",
   * that the connection will never yield another message.
   * This is automatically telegraphed in the {@link communicate}
   * method, but is useful for backend and frontend developers
   * to keep in mind.
   * 
   * It is the backend's responsibility to send an "error" message
   * if there are no more messages available. Otherwise, this
   * method will never resolve.
   */
  recv(): Promise<RecvMessage<S, T>>;
  /**
   * Call this to prematurely close the connection to the backend.
   * 
   * Closing a connection that is already closed should be legal
   * (no error thrown), as it is possible for the frontend to close
   * the connection before it is aware that the backend computation
   * has finished.
   * 
   * Dropping this connection without calling this method is fine
   * besides the fact that it may be wasting backend compute time.
   */
  close(): Promise<void>;
}

/**
 * The primary method for the frontend to make a computational request.
 * 
 * The reason why I recommend using `communicate` instead of using the
 * {@link ConnPool} and {@link Conn} interface directly is because this
 * method telegraphs the scope of a connection and automatically closes
 * it when there are no more references to it.
 * 
 * @param backend - A handle to a compute backend, capable of spawning connections
 *                  via {@link ConnPool}.
 * @param msg - A {@link SynMessage} to request some computational task.
 * @param body - A scoped closure which takes as its sole argument a `recv` callback
 *               that yields {@link RecvMessage} when awaited.
 * @returns - A void promise that resolves when the connection naturally finishes due
 *            to an "error" or "close" message.
 * 
 * `body` argument examples
 * ------------------------
 * An example of a `body` closure that receives and logs a single message is:
 * ```
 * const body = async recv => {
 *   const msg = await recv();
 *   console.log(msg)
 * }
 * ```
 *
 * An example of a `body` closure that receives and logs all messages is:
 * ```
 * const body = async recv => {
 *   while (true) {
 *      const msg = await recv();
 *      console.log(msg);
 *      if (msg.case === "error" || msg.case === "close") break;
 *   }
 * }
 * ```
 */
export function communicate<R, S, T>(
  backend: ConnPool<R, S, T>,
  msg: SynMessage<R>,
  body: (recv: () => Promise<RecvMessage<S, T>>) => Promise<void>
): Promise<void> {
  return backend.post(msg).then(async (conn) => {
    let closed = false;
    const cleanup = () => {
      if (!closed) {
        conn.close();
        closed = true;
      }
    };
    try {
      await body(async () => {
        const msg = await conn.recv();
        if (msg.case === "close" || msg.case === "error") cleanup();
        return msg;
      });
    } finally {
      cleanup();
    }
  });
}