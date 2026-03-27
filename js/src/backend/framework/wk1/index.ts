/**
 * @module wk1
 * 
 * The Wk1 (WorKer 1) protocol.
 * 
 * One possible protocol/channel for implementing the {@link ConnPool}
 * interface as described in the folder above. Developed as a
 * first pass JS-object protocol to communicate with Web Workers.
 * 
 * Submodules implement two connection pools using this protocol
 * for frontend developers:
 * 
 * @see Wk1NBPool
 * 
 * @see Wk1BLKPool
 */
import type { ConnPool } from "..";
export { Wk1NBPool } from "./frontend/nonBlocking";
export { Wk1BLKPool } from "./frontend/blocking";
export type { Wk1FrontendBase } from "./frontend/common";
