//! Common message types for the webworker backend.
use crate::adapters::JsValuePreserved;
use serde::{Deserialize, Serialize};
use serde_wasm_bindgen::from_value;
use tsify::Tsify;
use wasm_bindgen::{JsValue, prelude::wasm_bindgen};
pub mod featurize;

/// Request (or `SynMessage`) type.
///
/// Sent as part of [`Request`], or sent from
/// the main backend to one of its sub-workers.
#[derive(Tsify, Serialize, Deserialize)]
#[tsify(from_wasm_abi)]
pub struct Request<T = JsValuePreserved> {
    pub data: T,
}

/// Response (or `RecvMessage`) type.
///
/// Sent from backend to frontend.
#[derive(Tsify, Deserialize, Serialize)]
#[tsify(into_wasm_abi)]
#[serde(tag = "case", rename_all = "snake_case")]
pub enum Response<S, T = JsValuePreserved> {
    Yield { data: T },
    Close { data: T },
    Error { reason: S },
}

/// Response data type for batched backend.
/// 
/// See also [`crate::TaskSpawner`].
#[derive(Tsify, Deserialize, Serialize)]
pub struct ResponsePayloadWithWorkerID {
    #[serde(rename = "workerID")]
    pub worker_id: u32,
    pub data: JsValuePreserved
}
/// Get a `connID` field from a request object.
pub fn get_connection_id(request: JsValue) -> Result<String, serde_wasm_bindgen::Error> {
    /// Utility type for getting `connID` from a JsValue.
    #[derive(Deserialize)]
    struct ConnectionID {
        #[serde(rename = "connID")]
        conn_id: String
    }
    from_value::<ConnectionID>(request).map(|ConnectionID { conn_id }| conn_id)
}