//! Module defining [`ScopedHandle`].
use crate::adapters::{JsTypedFuture, js_typed_fut::JsTypedFutureError};
use futures::FutureExt;
use wasm_bindgen::prelude::Closure;
use web_sys::js_sys::{Function, Promise};

/// Struct used by [`crate::adapters::TaskSpawner`] to represent an ongoing
/// connection in the [`crate::adapters::TaskSpawner::spawn_batch_scoped`] function.
///
/// This struct should not be dropped before it is polled to
/// completion as it owns a closure which JS will call whenever it
/// feels like, as long as the promise is unresolved.
pub(super) struct ScopedHandle {
    /// Closure that JS can call for as long as the underlying
    /// promise is unresolved. It is only kept to prevent it
    /// from deallocating before JS calls it.
    #[allow(unused)]
    pub(super) body_closure: Closure<dyn FnMut(Function) -> Promise>,
    /// Inner promise returned by JS handler `spawnBatch`
    /// that is actually being awaited.
    pub(super) spawn_batch_promise: JsTypedFuture<()>,
}
impl Future for ScopedHandle {
    type Output = Result<(), JsTypedFutureError>;
    fn poll(
        self: std::pin::Pin<&mut Self>,
        cx: &mut std::task::Context<'_>,
    ) -> std::task::Poll<Self::Output> {
        self.get_mut().spawn_batch_promise.poll_unpin(cx)
    }
}
