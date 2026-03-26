//! Module defining [`PreserveEscapeHatch`],
//! which extracts the [`JsValue`] out of a
//! [`crate::deserializer::Deserializer`]
//! and deserializes it as a `u32`.
//!
//! Safety
//! ------
//! While technically not provably safe (see discussion in [`super::arena`]),
//! `JsValue`s are represented as indexes into a bounds checked array
//! which means that the worst this can do if fed in an arbitrary `u32`
//! not corresponding to a `JsValue` is panic-crash the program.
use crate::deserializer::escape_hatches::r#macro::escape_hatch_boilerplate;
use wasm_bindgen::{JsValue, convert::IntoWasmAbi};

/// A string used by [`serde_wasm_bindgen::preserve`] to extract
/// `u32`s that are actually [`JsValue`]s from a generic deserializer.
///
/// It is an arbitrary struct name that will probably only ever be
/// reached outside of this crate if it is adversarially targetted.
pub(super) const SERDE_WASM_BINDGEN_VALUE_MAGIC: &'static str =
    "1fc430ca-5b7f-4295-92de-33cf2b145d38";

escape_hatch_boilerplate!(
    #[doc = "The inner `u32` is assumed to represent the bits of a valid [`JsValue`]."]
    PreserveEscapeHatch, SERDE_WASM_BINDGEN_VALUE_MAGIC, "a specific internal `Deserializer` with a `JsValue`", 2, |OnValue((value): JsValue)| { (Self::Done, value.into_abi())} as (Self, u32));
