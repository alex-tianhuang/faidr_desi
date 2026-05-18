use crate::datatypes::{Request, webworker_messages::blocking};
use serde::Deserialize;
use serde_wasm_bindgen::from_value;
use wasm_bindgen::JsValue;

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
