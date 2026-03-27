/* tslint:disable */
/* eslint-disable */
/**
 * A JS-facing residue mapping type.
 */
export type AAMap<T> = Record<string, T>;

/**
 * A bunch of [`Segment`]s.
 */
export interface Segments {
    data: Segment[];
}

/**
 * A datatype representing a generic visualization of one
 * sequence feature for one sequence.
 *
 * There is no style or color information, as that is
 * expected to be computed by the rendering engine or its
 * associated adapters.
 */
export type Graphic = ({ kind: "segments" } & Segments) | ({ kind: "line-plot" } & LinePlot);

/**
 * A single contiguous region of a sequence.
 *
 * (0-indexed).
 */
export interface Segment {
    /**
     * The type of this segment.
     */
    label: string;
    /**
     * 0-indexed start.
     */
    start: number;
    /**
     * 0-indexed stop.
     */
    stop: number;
}

/**
 * A track of numeric values indexed by residue coordinate.
 */
export interface LinePlot {
    /**
     * Numeric values which are expected to be
     * spaced by 1 residue per value.
     */
    data: number[];
    /**
     * The 1-indexed start coordinate, such that
     * 1 will be plotted in the middle of the first
     * residue.
     */
    start: number;
}

/**
 * All possible blocking worker endpoints, plus the
 * necessary data to submit a request at each endpoint.
 */
export type RequestPayload = { endpoint: "webworker-featurize" } & RequestPayload;

/**
 * Data for the `featurize` endpoint.
 *
 * See [module level docs] for endpoint behaviour.
 *
 * [module level docs]: self
 */
export interface RequestPayload {
    /**
     * Sequences to featurize.
     *
     * It is assumed the caller sends sequences in a known order,
     * so the resulting sequence features for each sequence will
     * be returned associated to the index of the sequence in the
     * input list.
     *
     * Here\'s what that looks like:
     * ```
     * {
     *     \"sequenceByFeatureMatrix\": {
     *         \"0\": {
     *             // Features or errors for 1st sequence in list
     *         },
     *         \"1\": {
     *             // Features or errors for 2nd sequence in list
     *         },
     *         // ...
     *     }
     * }
     * ```
     */
    sequences: string[];
    /**
     * Parameters for the validation of the sequences.
     */
    sequence_validation_settings: AAStringValidationParameters;
    /**
     * Features to compute.
     */
    feature_configuration: FeatureContainerUserFacing;
    /**
     * Whether or not to return feature statistics,
     * if there are enough sequences for it.
     */
    statistics_included: boolean;
}

/**
 * Marshallable settings object describing how to validate an
 * arbitrary string to an aminoacid string with reasonable properties.
 *
 * See also [`AAStringParsingParameters`] and [`AAStringValidator`].
 */
export interface AAStringValidationParameters extends AAStringParsingParameters {
    /**
     * The minimum number of aminoacids constituting a sequence.
     */
    minSequenceLength: number;
}

/**
 * Marshallable settings object for how to parse aminoacid strings
 * that may contain non-aminoacid characters.
 */
export interface AAStringParsingParameters {
    /**
     * Whether or not to capitalize lowercase characters.
     */
    capitalizeMode: CapitalizeMode;
    /**
     * Whether or not to omit unexpected characters.
     */
    omitMode: OmitMode;
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
 * Whether or not to capitalize lowercase characters.
 */
export type CapitalizeMode = "strict" | "capitalize";

/**
 * Whether or not to omit unexpected characters.
 */
export type OmitMode = "strict" | "omit";

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
     * Number of concurrent workers this spawner contains.
     */
    numWorkers: number;
    /**
     * Inner JS callback for spawning tasks.
     */
    spawnBatch: (msg: Request<unknown[]>, body: (recv: () => Promise<Response<string, ResponsePayloadWithWorkerID>>) => Promise<void>) => Promise<void>;
}

export type RequestPayload = ({ endpoint: "featurize" } & RequestPayload) | ({ endpoint: "generate-mimic" } & RequestPayload) | ({ endpoint: "generate-ko" } & RequestPayload);


/**
 * A function exposed to JS that runs the blocking
 * or "private" endpoints of the server.
 *
 * This part of the server is responsible for doing blocking
 * work. Most of its endpoints do not have "nice" or stable
 * APIs. Some endpoints, which are "forwarded" by the non-blocking
 * server, will have "nice" and stable APIs.
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
 * A function exposed to JS that runs the non-blocking
 * or "public" endpoints of the server.
 *
 * This part of the server is responsible for scheduling
 * subworkers to do computations and communicating with the
 * frontend, and is expected to have a "vaguely user friendly"
 * API.
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

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly nonBlockingServer: (a: any, b: any, c: any) => any;
    readonly blockingServer: (a: any, b: any) => any;
    readonly wasm_bindgen__closure__destroy__h741dcdf28aa9b37c: (a: number, b: number) => void;
    readonly wasm_bindgen__closure__destroy__hde0771a99972c0ae: (a: number, b: number) => void;
    readonly wasm_bindgen__convert__closures_____invoke__h160f0161a2004307: (a: number, b: number, c: any) => [number, number];
    readonly wasm_bindgen__convert__closures_____invoke__h449ddb85c5091088: (a: number, b: number, c: any, d: any) => void;
    readonly wasm_bindgen__convert__closures_____invoke__h38c25dfc08a09f5b: (a: number, b: number, c: any, d: any) => void;
    readonly wasm_bindgen__convert__closures_____invoke__h0945a6622b0336d7: (a: number, b: number, c: any) => any;
    readonly wasm_bindgen__convert__closures_____invoke__hc2293323d26d8b8d: (a: number, b: number) => number;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __externref_table_dealloc: (a: number) => void;
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
