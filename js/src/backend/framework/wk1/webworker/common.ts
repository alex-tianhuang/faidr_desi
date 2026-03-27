/**
 * Common utilities for webworker-based backends.
 */

import type { Wk1Request, Wk1Response } from "../messagetypes";
import {
  type RecvMessage as GenericRecvMessage,
  type SynMessage as GenericSynMessage,
} from "../..";
import z from "zod";

/**
 * A base interface for the backend that can send messages and
 * subscribe to them.
 *
 * This is basically just a wrapper around `globalThis.postMessage`
 * and `globalThis.onmessage` that telegraphs a type constraint.
 */
export interface Wk1BackendBase {
  postMessage(msg: Wk1Response): void;
  onmessage: ((evt: MessageEvent<unknown>) => void) | null;
}
/**
 * Alias for {@link GenericSynMessage SynMessage}.
 */
export type SynMessageNoConnID<T> = GenericSynMessage<T>;
/**
 * Alias for {@link GenericRecvMessage RecvMessage} with
 * a common data pattern.
 */
export type RecvMessageNoConnID<T> = GenericRecvMessage<T, T>;
/**
 * {@link GenericSynMessage SynMessage} with a connection ID.
 */
export type SynMessage<T> = SynMessageNoConnID<T> & { connID: string };
/**
 * {@link GenericRecvMessage RecvMessage} with a connection ID.
 */
export type RecvMessage<T> = RecvMessageNoConnID<T> & { connID: string };

/**
 * Deserializes an arbitrary message (the type that comes from
 * `window.onmessage`) to a `Wk1Request`.
 */
export function deserializeWk1Request(data: unknown) {
  return Wk1RequestSchema.safeParse(data)
}

/**
 * Schema for {@link Wk1Request} without constraint on the
 * type of data posted.
 */
const Wk1RequestSchema = z.discriminatedUnion("case", [
  z.object({ case: z.literal("syn"), connID: z.string(), data: z.unknown() }),
  z.object({ case: z.literal("hup"), connID: z.string() })
]);