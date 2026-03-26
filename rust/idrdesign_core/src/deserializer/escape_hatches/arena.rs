//! Module defining [`ArenaEscapeHatch`],
//! which extracts the &[`Bump`] and [`JsValue`]
//! out of a [`crate::deserializer::Deserializer`]
//! and deserializes it as `(usize, u32)`.
//!
//! Safety
//! ------
//! I am pretty sure it is safe to interpret the fields of [`ArenaEscapeHatch`]
//! as `&Bump` and `JsValue`s, although I cannot prove it generally.
//! 
//! It is definitely safe if the deserializer constructs a [`SeqAccess`]
//! struct as in the [trusted module] to drive the `ArenaEscapeHatch` visitor.
//! 
//! It is not safe if someone intentionally finds a way to pass in a different
//! [`serde::de::SeqAccess`] implementor from outside the [trusted module],
//! while tricking a function in that module into calling `visitor.visit_seq`
//! through an entirely `#[track_caller]`-annotated call-stack.
//! I cannot at the moment figure out how to do this,
//! so I think it is safe enough from UB.
//! 
//! [trusted module]: `crate::deserializer::escape_hatches::trusted`
use crate::deserializer::escape_hatches::r#macro::escape_hatch_boilerplate;
use bumpalo::Bump;
use serde::{Deserialize, Deserializer};
use wasm_bindgen::{
    JsValue,
    convert::{FromWasmAbi, IntoWasmAbi as _},
};
/// An arbitrary struct name that will probably only ever be
/// reached outside of this crate if it is adversarially targetted.
///
/// When enocuntered, the crate's deserializer will assume that
/// an &[`Bump`] and [`JsValue`] should be extracted for the visitor
/// as a `(usize, u32)`.
pub(super) const ARENA_ESCAPE_HATCH_VALUE_MAGIC: &'static str =
    "ef7e5430-85cf-4c73-8e3a-960b62a51a34";
escape_hatch_boilerplate!(#[doc = "The inner `usize` is assumed to represent a live pointer to a [`Bump`].\nThe inner `u32` is assumed to represent the bits of a valid [`JsValue`]."]
ArenaEscapeHatch<'de>, ARENA_ESCAPE_HATCH_VALUE_MAGIC, "a specific internal `Deserializer` with a memory arena and a `JsValue`", 3, |OnArena(((arena, value)): (&'de Bump, JsValue))| {
    (Self::OnValue(value), arena as *const Bump as usize)
} as (Self, usize), |OnValue((value): JsValue)| { (Self::Done, value.into_abi())} as (Self, u32));
/// Extract a memory arena and `JsValue` from the deserializer.
/// 
/// This is generic over deserializer so that it fits with serde's
/// derive/trait framework, but in reality the only deserializer
/// that should succeed here is this crate's [`crate::deserializer::Deserializer`].
/// 
/// 
pub fn deserialize_arena_and_js_value<'de, D: Deserializer<'de>>(
    de: D,
) -> Result<(&'de Bump, JsValue), D::Error> {
    let ArenaEscapeHatch(_, arena_pointer, js_value_abi) = ArenaEscapeHatch::deserialize(de)?;
    unsafe {
        let arena = &*(arena_pointer as *const Bump);
        let js_value = FromWasmAbi::from_abi(js_value_abi);
        Ok((arena, js_value))
    }
}
