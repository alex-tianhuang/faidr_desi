//! Module defining [`Receiver`].
use crate::adapters::JsValuePreserved;
use serde::Deserialize;
use tsify::Tsify;
use wasm_bindgen::{JsCast, JsValue, UnwrapThrowExt};
use wasm_bindgen_futures::JsFuture;
use web_sys::js_sys::{Function, Promise};

/// Type of `recvToServer`, which returns a promise that
/// resolves on the next request from the frontend.
///
/// In JS, the handler should not throw an error before it
/// returns a promise, unless it wants the backend to terminate.
#[derive(Tsify, Deserialize)]
#[tsify(from_wasm_abi)]
pub struct Receiver(#[tsify(type = "() => Promise<Request<unknown> & { connID: string }>")] JsValuePreserved<Function>);
impl Receiver {
    /// Receive the next message from the frontend.
    pub fn recv(&self) -> JsFuture {
        let promise = self
            .0
            .call0(&JsValue::NULL)
            .and_then(|value| JsCast::dyn_into::<Promise>(value))
            .expect_throw("[Receiver] recv_to_server handler threw error before returning promise");
        return JsFuture::from(promise);
    }
}
