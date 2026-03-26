//! Module defining [`Sender`] and [`SenderHandle`].
//!
//! [`Sender`] is a minimal wrapper which can be used to send any [`Response`],
//! and may result in accidentally sending messages after an error or
//! close message, which is probably bad.
//!
//! For a bit of a safer sending mechanism, check out [`SenderHandle`].
use crate::{
    adapters::{JsTypedFuture, JsValuePreserved, js_typed_fut::JsTypedFutureError, serialize},
    datatypes::Response,
};
use futures::future::{self, Either};
use serde::{Deserialize, Serialize};
use tsify::Tsify;
use wasm_bindgen::{JsCast, JsValue, UnwrapThrowExt};
use web_sys::js_sys::{Function, Promise};

/// Type of `sendFromServer`, which returns a promise resolving with
/// the result of attempting to send one message.
///
/// In JS, the handler should not throw an error before it returns a promise,
/// unless it wants the backend to terminate. The promise should only be rejected
/// if the connection hangs up (in which case nothing else needs to happen)
/// or if there is some assertion failure (in which case the handler is
/// expected to send the final error message).
#[derive(Tsify, Deserialize)]
#[tsify(from_wasm_abi)]
pub struct Sender(
    #[tsify(type = "(resp: Response<string, unknown> & { connID: string }) => Promise<void>")] JsValuePreserved<Function>,
);
/// Message type that [`Sender`] returns to JS.
/// 
/// Includes `connID` so that JS knows which
/// frontend connection to send this data.
#[derive(Serialize)]
struct ResponseUnionConnID<S> {
    #[serde(flatten)]
    inner: Response<S>,
    #[serde(rename = "connID")]
    conn_id: S
}
impl Sender {
    /// Send a response to the underlying JS implementation.
    ///
    /// This method is not meant to be used directly because you can send multiple
    /// closing or error messages, which the frontend will not acknowledge.
    /// Try using the [`SenderHandle`] struct to prevent duplicate sending.
    fn send<S: Serialize>(&self, msg: &ResponseUnionConnID<S>) -> JsTypedFuture<()> {
        let resp = serialize(msg);
        let promise = self
            .0
            .call1(&JsValue::NULL, &resp)
            .and_then(|value| JsCast::dyn_into::<Promise>(value))
            .expect_throw("[Sender] failed to call js `sendFromServer` handler");
        return JsTypedFuture::new(promise);
    }
    /// Make a [`SenderHandle`] from a connection ID.
    pub(crate) fn handle(&self, conn_id: String) -> SenderHandle {
        SenderHandle {
            inner: Sender(self.0.clone()),
            conn_id: Some(conn_id),
        }
    }
}
/// Wraps a `sendFromServer` handler (see [`Sender`]).
///
/// Unlike [`Sender`] this represents an active connection and therefore has
/// stronger restrictions on what to send. For example, you can use the Sender to
/// send as many yield messages as you would like, but cannot send an error or close
/// message without consuming it.
///
/// Assumption about the handler
/// ----------------------------
/// In JS, the handler should not throw an error before it returns a promise,
/// unless it wants the backend to terminate. The promise must resolve to a nullish
/// value or these methods will return an error indisguishable from a thrown error.
///
/// The other requirement for the handler is that it sends the final message
/// in case of an error. i.e. the returned promise should only be rejected
/// if the connection hangs up (in which case nothing else needs to happen)
/// or if there is some assertion failure (in which case the handler is
/// expected to send the final error message).
///
/// Upholding the last condition will help ensure that on failed sends,
/// the Sender can be dropped without leaving a hanging connection.
pub(crate) struct SenderHandle {
    inner: Sender,
    conn_id: Option<String>,
}
impl SenderHandle {
    /// Send a yield message to the frontend.
    ///
    /// As documented in [`SenderHandle`], the assumption is that the handler
    /// in JS is responsible for sending the "dying" message and does all the
    /// cleanup, so this method will destroy the handle on an error instead
    /// of sending an error message from the Rust side.
    ///
    /// The promise returned by the handler must resolve to a nullish value or
    /// these methods will return an error indisguishable from a thrown error.
    pub fn send_data<S: Serialize>(mut self, data: &S) -> impl 'static + Future<Output = Result<Self, JsValue>> {
        match self.conn_id.as_deref() {
            Some(conn_id) => {
                let msg = ResponseUnionConnID {
                    inner: Response::Yield {
                        data: JsValuePreserved::new(serialize(data)),
                    },
                    conn_id,
                };
                let fut = self.inner.send(&msg);
                Either::Left(async move {
                    match fut.await {
                        Ok(()) => Ok(self),
                        Err(e) => {
                            self.mark_closed();
                            Err(e.reject())
                        }
                    }
                })
            }
            None => Either::Right(future::ready(Err(JsValue::from_str(
                "[SenderHandle] tried to send message after channel closed",
            )))),
        }
    }
    /// Send a close message to the frontend, and close the channel.
    ///
    /// The promise returned by the handler must resolve to a nullish
    /// value or these methods will return an error indisguishable from a thrown error.
    pub fn send_close<S: Serialize>(mut self, data: &S) -> impl 'static + Future<Output = Result<(), JsValue>> {
        match self.conn_id.take() {
            Some(conn_id) => {
                let msg = ResponseUnionConnID {
                    inner: Response::Close {
                        data: JsValuePreserved::new(serialize(data)),
                    },
                    conn_id,
                };
                let fut = self.inner.send(&msg);
                Either::Left(async move { fut.await.map_err(JsTypedFutureError::reject) })
            }
            None => Either::Right(future::ready(Err(JsValue::from_str(
                "[SenderHandle] tried to send message after channel closed",
            )))),
        }
    }
    /// Send an error message to the frontend, and close the channel.
    ///
    /// The promise returned by the handler must resolve to a nullish value or
    /// these methods will return an error indisguishable from a thrown error.
    pub fn send_error(
        mut self,
        reason: &str,
    ) -> impl 'static + Future<Output = Result<(), JsValue>> {
        match self.conn_id.take() {
            Some(conn_id) => {
                let msg = ResponseUnionConnID {
                    inner: Response::Error { reason },
                    conn_id: &conn_id,
                };
                let fut = self.inner.send(&msg);
                Either::Left(async move { fut.await.map_err(JsTypedFutureError::reject) })
            }
            None => Either::Right(future::ready(Err(JsValue::from_str(
                "[SenderHandle] tried to send message after channel closed",
            )))),
        }
    }
    /// Prevent any future sends, including the last one in the destructor.
    fn mark_closed(&mut self) {
        self.conn_id = None;
    }
}
impl Drop for SenderHandle {
    fn drop(&mut self) {
        if let Some(conn_id) = self.conn_id.take() {
            let msg = ResponseUnionConnID {
                inner: Response::Error {
                    reason: "[SenderHandle] backend dropped connection without sending close",
                },
                conn_id: &conn_id,
            };
            let _: JsTypedFuture<()> = self.inner.send(&msg);
        }
    }
}
