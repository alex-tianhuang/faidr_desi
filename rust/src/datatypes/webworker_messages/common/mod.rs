//! Common message types for the webworker backend.
use crate::adapters::JsValuePreserved;
use serde::{Deserialize, Serialize, de::DeserializeOwned};
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
#[derive(Tsify, Serialize)]
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
    pub data: JsValuePreserved,
}
/// Get a `connID` field from a request object.
pub fn get_connection_id(request: JsValue) -> Result<String, serde_wasm_bindgen::Error> {
    /// Utility type for getting `connID` from a JsValue.
    #[derive(Deserialize)]
    struct ConnectionID {
        #[serde(rename = "connID")]
        conn_id: String,
    }
    from_value::<ConnectionID>(request).map(|ConnectionID { conn_id }| conn_id)
}
// serde derive + tags + JsValuePreserved doesn't work together
// according to Claude Sonnet 4.6, so handrolling deserialize here
impl<'de, S, T> Deserialize<'de> for Response<S, T>
where
    S: DeserializeOwned,
    T: DeserializeOwned,
{
    fn deserialize<D>(de: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let value: JsValue = serde_wasm_bindgen::preserve::deserialize(de)?;
        #[derive(Deserialize)]
        #[serde(rename_all = "snake_case")]
        enum ResponseCase {
            Yield,
            Close,
            Error,
        }
        #[derive(Deserialize)]
        struct Response_ {
            case: ResponseCase,
        }
        let Response_ { case } =
            from_value::<Response_>(value.clone()).map_err(serde::de::Error::custom)?;
        match case {
            ResponseCase::Close | ResponseCase::Yield => {
                #[derive(Deserialize)]
                struct Response_<T> {
                    data: T,
                }
                let Response_ { data } =
                    from_value::<Response_<T>>(value).map_err(serde::de::Error::custom)?;
                if matches!(case, ResponseCase::Yield) {
                    Ok(Response::Yield { data })
                } else {
                    Ok(Response::Close { data })
                }
            }
            ResponseCase::Error => {
                #[derive(Deserialize)]
                struct Response_<S> {
                    reason: S,
                }
                let Response_ { reason } =
                    from_value::<Response_<S>>(value).map_err(serde::de::Error::custom)?;
                Ok(Response::Error { reason })
            }
        }
    }
}
