//! Important submodule that checks that no external crate
//! is attempting to deserialize [`arena::ArenaEscapeHatch`]
//! or [`jsvalue::PreserveEscapeHatch`].
//! 
//! Dev note
//! --------
//! The way this works is that the visitors that generate
//! those escape-hatch tuple structs have a specially crafted
//! [`serde::de::Visitor::visit_seq`] method:
//! 1. They call [`caller_is_trusted`], which gets the [`Location`]
//!    of the first call site that is not annotated with `#[track_caller]`.
//!    It asserts that that call site should be the same as this
//!    file you are currently reading (assuming you are reading the source files).
//! 2. The [`serde::de::Visitor::visit_seq`] methods themselves are
//!    annotated with `#[track_caller]`, so the caller `Location`
//!    of the call site to `visitor.visit_seq` needs to be in this file
//!    (intended usage). The only way then to deserialize invalid data
//!    into these escape-hatch tuple structs is to adversarially trick a
//!    function in this file into calling a fully `#[track_caller]`-annotated
//!    call-stack ending with `visitor.visit_seq`.
//! 
//! I can't figure out how to prove that this is impossible at the moment,
//! but it seems like it will at least take great effort to cause UB.
use std::panic::Location;
use bumpalo::Bump;
use wasm_bindgen::JsValue;
use crate::deserializer::escape_hatches::{arena, jsvalue};

/// Hand the deserialization visitor a `JsValue`,
/// represented as its ABI (`u32`). Used when we
/// really believe that the caller has asked to
/// deserialize a `JsValue` specifically from a
/// [`crate::deserializer::Deserializer`].
/// 
/// Dev note
/// --------
/// This function is internal and cannot move from the
/// file that [`caller_is_trusted`] is defined without
/// breaking existing behaviour.
/// 
/// It behaves much like [`visit_arena_escape_hatch`]
/// except does not yield the arena reference as `usize`.
pub fn visit_preserve_escape_hatch<'de, V>(
    visitor: V,
    value: JsValue,
) -> Result<V::Value, serde_wasm_bindgen::Error>
where
    V: serde::de::Visitor<'de>,
{
    visitor.visit_seq(jsvalue::SeqAccess::OnMagic(value))
}

/// Hand the deserialization visitor an `&Bump`,
/// cast as a pointer then a `usize`, and a `JsValue`,
/// represented as its ABI (`u32`). Used when we
/// really believe that the caller has asked to
/// deserialize `(&Bump, JsValue)` specifically from a
/// [`crate::deserializer::Deserializer`].
/// 
/// Dev note
/// --------
/// This function is internal and cannot move from the
/// file that [`caller_is_trusted`] is defined without
/// breaking existing behaviour.
/// 
/// This function gives the visitor a sequence that looks
/// like `(MAGIC_STRING, usize, u32)`. My visitor will
/// assume the `usize` is the address of a live `Bump`
/// arena and that the `u32` represents a live `JsValue`
/// (via [`wasm_bindgen::convert::FromWasmAbi::from_abi`]).
/// 
/// Since any deserializer could hand a tuple sequence of
/// this form in, the caller could theoretically hand my
/// visitor `(MAGIC_STRING, 0_usize, ...)` and cause
/// me to treat `0_usize` as a valid `&Bump` (UB). I combat this
/// by annotating my `visitor.visit_seq` with a `#[track_caller]`
/// that bubbles up to this file. To ensure that the caller
/// is my (this) trusted file, I do a runtime (maybe optimized
/// to compile time) check to see that the caller of
/// `visitor.visit_seq` is this file, by using
/// [`caller_is_trusted`].
/// 
/// This makes it hard (possibly impossible but I have
/// not actually bothered to consider all edge cases) 
/// to give the visitor a `usize` from something other
/// than a live `&Bump` passed through this function specifically.
/// Exactly the same discussion for ensuring that the `u32`
/// passed in is actually live `JsValue` ABI value.
pub fn visit_arena_escape_hatch<'de, V>(
    visitor: V,
    arena: &'de Bump,
    value: JsValue,
) -> Result<V::Value, serde_wasm_bindgen::Error>
where
    V: serde::de::Visitor<'de>,
{
    visitor.visit_seq(arena::SeqAccess::OnMagic((arena, value)))
}
/// Checks that the first unannotated caller of
/// this function is one of the other functions
/// in this file.
/// 
/// Dev note
/// --------
/// This function is internal. See [module level](self)
/// docs for more information about how all of these
/// functions work together.
/// 
/// Unless you are an adversary attempting to make
/// my codebase dereference a null pointer or something,
/// this will statically return `true` as I ensure it is
/// only called through callstacks that bubble up to
/// the other functions in this file.
#[track_caller]
pub fn caller_is_trusted() -> bool {
    Location::caller().file() == file!()
}