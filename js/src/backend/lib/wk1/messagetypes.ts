/**
 * A file of two message types for the Wk1 protocol.
 * 
 * Done to not have cyclic imports.
 */

/**
 * A frontend to backend message in the Wk1 protocol.
 * 
 * Tagged enum by the field "case":
 * ```
 * "syn" => Synchronizing message, representing an initial request
 *          to do some computation.
 * "hup" => Hang-up message, to close a connection prematurely.
 * ```
 * 
 * Closing a connection that is already closed should be legal
 * (no error thrown), as it is possible for the frontend to close
 * the connection before it is aware that the backend computation
 * has finished.
 */
export type Wk1Request<R = unknown> =
  | { case: "syn"; data: R; connID: string }
  | { case: "hup"; connID: string };

/**
 * A backend to frontend message in the Wk1 protocol.
 * 
 * Tagged enum by the field "case":
 * ```
 * "ack/syn" => "syn" message was successfully received.
 * "ack/hup" => "hup" message was successfully received and
 *              corresponding connection has been closed.
 * "yield" => Non-terminal message (e.g. with incremental progress).
 * "close" | "error" => Terminal messages, with the same conventions
 *                      as `RecvMessage`'s "close" and "error" cases. 
 * ```
 * 
 * Note that an "error" message may not have a corresponding `connID`
 * associated with it. In that case, the backend has crashed and is
 * letting all connections know.
 */
export type Wk1Response<S = unknown, T = unknown> =
  | { case: "ack/syn"; connID: string }
  | { case: "ack/hup"; connID: string }
  | { case: "yield"; connID: string; data: S }
  | { case: "close"; connID: string; data: T }
  | { case: "error"; connID: string | null; reason: string };

/**
 * {@link Wk1Response} without the connection ID.
 */
export type Wk1ResponseNoConnID =
  | { case: "ack/syn"; }
  | { case: "ack/hup"; }
  | { case: "yield"; data: unknown }
  | { case: "close"; data: unknown }
  | { case: "error"; reason: string };