//! Module defining [`JsValuePreserved`].
use serde::{Deserialize, Serialize};
use std::{fmt::Debug, ops::Deref};
use wasm_bindgen::{JsCast, JsValue};

/// Wrapper type around any JS-castable type (default [`JsValue`]),
/// which just makes it deserializable and serializable.
/// 
/// Used to reduce boilerplate when writing serde types.
/// 
/// Get the inner value by deref or with [`JsValuePreserved::into_inner`].
#[derive(Clone)]
pub struct JsValuePreserved<T: JsCast = JsValue>(T);
impl<T: JsCast> JsValuePreserved<T> {
    /// Make a new [`JsValuePreserved`].
    pub fn new(t: T) -> Self {
        Self(t)
    }
    /// Get the inner [`JsValue`] that this [`JsValuePreserved`] holds.
    pub fn into_inner(self) -> T {
        self.0
    }
}
impl<T: JsCast> Deref for JsValuePreserved<T> {
    type Target = T;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
impl<T: JsCast + Debug> Debug for JsValuePreserved<T> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        Debug::fmt(&self.0, f)
    }
}
impl<'de, T: JsCast> Deserialize<'de> for JsValuePreserved<T> {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        serde_wasm_bindgen::preserve::deserialize(deserializer).map(JsValuePreserved)
    }
}
impl<T: JsCast> Serialize for JsValuePreserved<T> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serde_wasm_bindgen::preserve::serialize(&self.0, serializer)
    }
}
