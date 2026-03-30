mod blocking;
mod non_blocking;
pub use non_blocking::non_blocking_server;
pub use blocking::blocking_server;
use wasm_bindgen::{JsCast, JsValue};
use web_sys::js_sys::Error;

/// A shared utility for detecting if the given error
/// is a hang-up error, which does not need to be logged
/// at the `error` level.
fn is_hup_error(value: &JsValue) -> bool {
    let Some(err) = value.dyn_ref::<Error>() else { return false };
    err.message().to_string() == "connection dropped by frontend"
}