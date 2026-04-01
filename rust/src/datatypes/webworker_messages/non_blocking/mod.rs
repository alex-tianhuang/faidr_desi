use crate::datatypes::{Request, webworker_messages::blocking};
use serde::Deserialize;
use serde_wasm_bindgen::from_value;
use tsify::Tsify;
use wasm_bindgen::JsValue;
pub mod featurize;

#[derive(Tsify, Deserialize)]
#[serde(tag = "endpoint", rename_all = "kebab-case")]
pub enum RequestPayload {
    /// Endpoint for computing sequence features of many sequences.
    ///
    /// See [featurize module docs] for endpoint behaviour.
    ///
    /// [featurize module docs]: featurize
    Featurize(featurize::RequestPayload),
}

/// Determine if a request can be forwarded to a blocking
/// (internal) worker.
pub fn request_is_forwardable(request: JsValue) -> bool {
    /// The minimal amount of information
    /// needed to forward a request to a blocking
    /// (internal) endpoint.
    #[derive(Deserialize)]
    struct ForwardableRequest {
        #[allow(unused)]
        endpoint: blocking::Endpoint,
    }
    from_value::<Request<ForwardableRequest>>(request).is_ok()
}
