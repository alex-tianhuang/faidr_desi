//! Module defining [`TaskSpawner`].
use crate::{
    adapters::{
        JsTypedFuture, JsValuePreserved, js_typed_fut::JsTypedFutureError, serialize,
        task_spawner::scoped_handle::ScopedHandle,
    },
    datatypes::{Request, Response, webworker_messages::common::ResponsePayloadWithWorkerID},
};
use serde::{Deserialize, Serialize};
use tsify::Tsify;
use wasm_bindgen::{UnwrapThrowExt, prelude::Closure};
use web_sys::js_sys::{Function, Promise};
mod scoped_handle;

/// Wraps a `spawnBatch` handler which communicates with sub-workers
/// to do (primarily blocking) tasks.
///
/// The handler must take two arguments:
/// 1. `msg` -> a list of requests to send to the backend initially
/// 2. `body` -> an async closure which has access to a response stream (`recv`)
/// and returns a promise that resolves when the connection is handled and then closed.
///
/// If the `spawnBatch` handler throws before it returns a promise, it will cause the backend to terminate.
/// If the `recv` handler throws before it returns a promise, it will also cause the backend to terminate.
#[derive(Tsify, Deserialize, Clone)]
#[tsify(from_wasm_abi)]
#[serde(rename_all = "camelCase")]
pub struct TaskSpawner {
    /// Inner JS callback for spawning tasks.
    #[tsify(
        type = "(msg: Request<unknown[]>, body: (recv: () => Promise<Response<string, ResponsePayloadWithWorkerID>>) => Promise<void>) => Promise<void>"
    )]
    spawn_batch: JsValuePreserved<Function>,
}
/// Shorthand for turning the `recv` JS closure
/// (in the docs above) to a rust closure.
macro_rules! recv_js_to_rust {
    ($recv:expr) => {
        Box::new(move || {
            let promise = $recv
                .call0(&wasm_bindgen::JsValue::NULL)
                .and_then(|value| wasm_bindgen::JsCast::dyn_into::<web_sys::js_sys::Promise>(value))
                .expect_throw("[recv_js_to_rust] failed to call `recv` handler");
            crate::adapters::JsTypedFuture::new(promise)
        })
    };
}
/// Shorthand for calling the `spawn_batch` JS closure in rust.
macro_rules! call_spawn_batch {
    ($spawn_batch:expr, $msg:expr, $body_closure:expr) => {
        crate::adapters::JsTypedFuture::new(
            $spawn_batch
                .call2(&wasm_bindgen::JsValue::NULL, &$msg, $body_closure.as_ref())
                .and_then(|value| wasm_bindgen::JsCast::dyn_into::<web_sys::js_sys::Promise>(value))
                .expect_throw("[call_spawn_batch] failed to call `spawnBatch` handler"),
        )
    };
}
impl TaskSpawner {
    /// Send a list of requests to sub-workers.
    ///
    /// Serialization of the `msg` into a JsValue should
    /// never fail, or the backend will terminate.
    ///
    /// Dev note
    /// --------
    /// The difference between this and [`TaskSpawner::spawn_batch_streaming`]
    /// is that this has a similar syntax as the JS-side function `communicate`.
    ///
    /// The idea is that you provide a function which processes the incoming
    /// responses, and after the function exits you can be sure the connection
    /// is terminated.
    ///
    /// Because it has a similar syntax as the JS-side,
    /// this makes it much, much easier to write than the other function.
    pub(crate) fn spawn_batch_scoped<T: AsRef<[JsValuePreserved]> + Serialize>(
        &self,
        req: Request<T>,
        body: impl 'static
        + FnOnce(
            Box<dyn Fn() -> JsTypedFuture<Response<String, ResponsePayloadWithWorkerID>>>,
        ) -> Promise,
    ) -> impl Future<Output = Result<(), JsTypedFutureError>> + 'static {
        let body_closure =
            Closure::once(Box::new(move |recv: Function| body(recv_js_to_rust!(recv)))
                as Box<dyn FnOnce(Function) -> Promise>);
        let spawn_batch_promise =
            call_spawn_batch!(self.spawn_batch, serialize(&req), body_closure);
        ScopedHandle {
            body_closure,
            spawn_batch_promise,
        }
    }
}
