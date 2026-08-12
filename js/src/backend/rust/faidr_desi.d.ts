/* tslint:disable */
/* eslint-disable */
/**
 * A JS-facing residue mapping type.
 */
export type AAMap<T> = Record<string, T>;

/**
 * All possible blocking worker endpoints, plus the
 * necessary data to submit a request at each endpoint.
 */
export type RequestPayload = { endpoint: "featurize" } & RequestPayload;

/**
 * Data for the `featurize` endpoint.
 *
 * See [module level docs] for endpoint behaviour.
 *
 * [module level docs]: self
 */
export interface RequestPayload {
    /**
     * Sequence to featurize.
     */
    sequence: AACanonicalString;
    /**
     * Features to compute.
     */
    featureConfiguration: FeatureContainerUserFacing;
}

/**
 * Request (or `SynMessage`) type.
 *
 * Sent as part of [`Request`], or sent from
 * the main backend to one of its sub-workers.
 */
export interface Request<T> {
    data: T;
}

/**
 * Response (or `RecvMessage`) type.
 *
 * Sent from backend to frontend.
 */
export type Response<S, T> = { case: "yield"; data: T } | { case: "close"; data: T } | { case: "error"; reason: S };

/**
 * Response data type for batched backend.
 *
 * See also [`crate::TaskSpawner`].
 */
export interface ResponsePayloadWithWorkerID {
    workerID: number;
    data: JsValuePreserved;
}

/**
 * Return type of [`parse_text_as_sequence`].
 */
export type ParsedSequence = { case: "ok"; sequence: string; relevantSpan: [number, number] } | { case: "error"; error: JsValuePreserved<Error>; relevantSpan: [number, number] };

/**
 * Standard 20 aminoacids.
 *
 * The enum is defined so that casting it into a byte
 * returns the capitalized single-letter aminoacid.
 */
export type Aminoacid = "A" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "K" | "L" | "M" | "N" | "P" | "Q" | "R" | "S" | "T" | "V" | "W" | "Y";

/**
 * Type of `recvToServer`, which returns a promise that
 * resolves on the next request from the frontend.
 *
 * In JS, the handler should not throw an error before it
 * returns a promise, unless it wants the backend to terminate.
 */
export type Receiver = () => Promise<Request<unknown> & { connID: string }>;

/**
 * Type of `sendFromServer`, which returns a promise resolving with
 * the result of attempting to send one message.
 *
 * In JS, the handler should not throw an error before it returns a promise,
 * unless it wants the backend to terminate. The promise should only be rejected
 * if the connection hangs up (in which case nothing else needs to happen)
 * or if there is some assertion failure (in which case the handler is
 * expected to send the final error message).
 */
export type Sender = (resp: Response<string, unknown> & { connID: string }) => Promise<void>;

/**
 * Wraps a `spawnBatch` handler which communicates with sub-workers
 * to do (primarily blocking) tasks.
 *
 * The handler must take two arguments:
 * 1. `msg` -> a list of requests to send to the backend initially
 * 2. `body` -> an async closure which has access to a response stream (`recv`)
 * and returns a promise that resolves when the connection is handled and then closed.
 *
 * If the `spawnBatch` handler throws before it returns a promise, it will cause the backend to terminate.
 * If the `recv` handler throws before it returns a promise, it will also cause the backend to terminate.
 */
export interface TaskSpawner {
    /**
     * Inner JS callback for spawning tasks.
     */
    spawnBatch: (msg: Request<unknown[]>, body: (recv: () => Promise<Response<string, ResponsePayloadWithWorkerID>>) => Promise<void>) => Promise<void>;
}


/**
 * A function exposed to JS that runs the blocking work.
 *
 * The function takes:
 * 1. An async function that resolves on the next message to the server.
 *    (see [`Receiver`] docs).
 * 2. An async function that takes a message and resolves after it is sent to the frontend.
 *    Preferably this function should reject the promise in JS if the connection is closed.
 *    (see [`Sender`] docs).
 *
 * It crashes for reasons in the [`Receiver`] or [`Sender`] docs,
 * or if it fails to deserialize a connection ID from an received message.
 */
export function blockingServer(receiver: Receiver, sender: Sender): Promise<any>;

/**
 * Forwards requests to the blocking server.
 *
 * The function takes:
 * 1. An async function that resolves on the next message to the server.
 *    (see [`Receiver`] docs).
 * 2. An async function that takes a message and resolves after it is sent to the frontend.
 *    Preferably this function should reject the promise in JS if the connection is closed.
 *    (see [`Sender`] docs).
 * 3. An async function that communicates with workers (see [`TaskSpawner`] docs).
 *
 * It crashes for reasons in the [`Receiver`], [`Sender`], or [`TaskSpawner`] docs,
 * or if it fails to deserialize a connection ID from an received message.
 */
export function nonBlockingServer(receiver: Receiver, sender: Sender, task_spawner: TaskSpawner): Promise<any>;

/**
 * Given some text from a text area, parse a sequence from it.
 */
export function parseTextAsSequence(text: string): ParsedSequence;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly blockingServer: (a: any, b: any) => any;
    readonly nonBlockingServer: (a: any, b: any, c: any) => any;
    readonly parseTextAsSequence: (a: number, b: number) => any;
    readonly __wasm_bindgen_func_elem_213: (a: number, b: number) => void;
    readonly __wasm_bindgen_func_elem_2473: (a: number, b: number) => void;
    readonly __wasm_bindgen_func_elem_3452: (a: number, b: number, c: any) => [number, number];
    readonly __wasm_bindgen_func_elem_3450: (a: number, b: number, c: any, d: any) => void;
    readonly __wasm_bindgen_func_elem_283: (a: number, b: number, c: any) => any;
    readonly __wbindgen_export: (a: number, b: number) => number;
    readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_export3: (a: number) => void;
    readonly __wbindgen_export4: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_export5: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
