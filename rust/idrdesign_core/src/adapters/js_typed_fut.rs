//! Module defining [`JsTypedFuture`], just to wrap
//! some common deserialization logic.
//!
//! Mostly I use it like:
//! ```
//! let data: Result<Payload, JsValue> = JsTypedFuture::new(promise)
//!     .await
//!     .map_err(JsTypedFutureError::reject);
//! ```
use serde::de::DeserializeOwned;
use serde_wasm_bindgen::from_value;
use std::{
    marker::PhantomData,
    pin::Pin,
    task::{Poll, ready},
};
use thiserror::Error;
use wasm_bindgen::{JsError, JsValue};
use wasm_bindgen_futures::JsFuture;
use web_sys::js_sys::Promise;

/// Wraps a [`JsFuture`] with an expectation
/// to be deserialized into some type.
pub(crate) struct JsTypedFuture<T: DeserializeOwned> {
    _phantom: PhantomData<dyn Unpin + FnOnce() -> T>,
    inner: JsFuture,
}
impl<T: DeserializeOwned> JsTypedFuture<T> {
    /// Wraps a [`JsFuture`] with an expectation
    /// to be deserialized into some type.
    pub fn new(promise: Promise) -> Self {
        Self {
            _phantom: PhantomData,
            inner: JsFuture::from(promise),
        }
    }
}
/// The error type of a promise handled by [`JsTypedFuture`].
#[derive(Debug, Error)]
pub(crate) enum JsTypedFutureError {
    /// Promise was resolved but the response was not
    /// deserializable as expected.
    #[error("failed to deserialize value, {reason}: {value:?}")]
    SerdeErr {
        /// The unrecognized value.
        value: JsValue,
        /// The reason for failed deserialization.
        reason: serde_wasm_bindgen::Error,
    },
    /// Promise was rejected.
    #[error("uncaught exception: {reason:?}")]
    Rejected { reason: JsValue },
}
impl JsTypedFutureError {
    /// Coalesces the deserialization error into a [`JsValue`].
    ///
    /// Mostly I use it like this, but maybe one day I won't want to.
    pub fn reject(self) -> JsValue {
        match self {
            Self::Rejected { reason } => reason,
            Self::SerdeErr { .. } => JsError::new(&self.to_string()).into(),
        }
    }
}

impl<T: DeserializeOwned> Future for JsTypedFuture<T> {
    type Output = Result<T, JsTypedFutureError>;
    fn poll(self: Pin<&mut Self>, cx: &mut std::task::Context<'_>) -> Poll<Self::Output> {
        let result = ready!(Pin::new(&mut self.get_mut().inner).poll(cx));
        let value = match result {
            Ok(value) => value,
            Err(reason) => return Poll::Ready(Err(JsTypedFutureError::Rejected { reason })),
        };
        match from_value::<T>(value.clone()) {
            Ok(value) => Poll::Ready(Ok(value)),
            Err(reason) => Poll::Ready(Err(JsTypedFutureError::SerdeErr { value, reason })),
        }
    }
}
