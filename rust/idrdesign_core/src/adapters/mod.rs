//! Various utilities for communicating with the JS runtime.
mod js_typed_fut;
mod js_value_preserved;
mod pseudomap;
mod receiver;
mod sender;
mod task_spawner;
use std::panic::Location;

pub(crate) use js_typed_fut::JsTypedFuture;
pub use js_value_preserved::JsValuePreserved;
pub(crate) use pseudomap::PseudoMap;
pub use receiver::Receiver;
pub use sender::Sender;
pub(crate) use sender::SenderHandle;
use serde::Serialize;
use serde_wasm_bindgen::Serializer;
pub(crate) use task_spawner::StreamHandle;
pub use task_spawner::TaskSpawner;
use wasm_bindgen::JsValue;
use wasm_bindgen::throw_str;

/// Serialize a value to a JsValue.
///
/// Made the decision to throw a JS error on failure
/// because serialization should never fail in my
/// use cases, unless there has been developer error.
#[track_caller]
pub(crate) fn serialize<S: Serialize>(data: &S) -> JsValue {
    const SERIALIZER: Serializer = Serializer::json_compatible();
    match data.serialize(&SERIALIZER) {
        Ok(data) => data,
        Err(err) => throw_str(&format!(
            "[serialize (caller={:?})] failed to serialize something: {}",
            Location::caller(),
            err
        )),
    }
}
