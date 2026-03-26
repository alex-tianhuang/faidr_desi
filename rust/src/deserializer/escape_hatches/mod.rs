//! Submodules for extracting a memory arena and `JsValue`
//! from a [`Deserializer`].
//! 
//! Dev note
//! --------
//! The point of this module is to define the function
//! [`deserialize_arena_and_js_value`].
//! 
//! Much like [`serde_wasm_bindgen::preserve::deserialize`],
//! this function offers a way for deserialization implementations to
//! access the specific data held by this crate's deserializer, even
//! when the implementation is generic over all [`serde::Deserializer`]s.
//! 
//! The way it's set up is like so:
//! 1. A developer that wants access to the memory arena during
//!    deserialization uses `deserialize_arena_and_js_value` or
//!    `serde_wasm_bindgen::preserve::deserialize`.
//! 2. Those functions will both deserialize a tuple struct wrapper
//!    (I call this an "escape-hatch" tuple struct, `serde_wasm_bindgen`
//!    calls it `PreservedValueDeWrapper` in its `preserve` module).
//!    This tuple struct contains several numbers whose bits actually
//!    represent &[`bumpalo::Bump`] and [`serde_wasm_bindgen::JsValue`]s.
//!    The function will call `EscapeHatchTupleStruct::deserialize` for
//!    some tuple struct that acts as an "escape-hatch" out of generic serde.
//! 3. `EscapeHatch::deserialize` calls
//!    `deserializer.deserialize_tuple_struct(struct_name = MAGIC_STRING, ...)`
//!    for a magic string that is some arbitrary string that will never be encountered
//!    as a struct name except for adversarially.
//! 4. `Deserializer::deserialize_tuple_struct` (for the deserializer in this crate)
//!    will check the name of the struct it is deserializing and see if it matches
//!    a known magic string (i.e. [`ARENA_ESCAPE_HATCH_VALUE_MAGIC`] or [`SERDE_WASM_BINDGEN_VALUE_MAGIC`]).
//!    If it does, it will deserialize an &[`bumpalo::Bump`] by transmuting it to a
//!    `usize` and a [`JsValue`] by transmuting it to a `u32`. So the tuple struct
//!    will receive a usize and a u32 as two of its fields, but these values can be
//!    transmuted back to a reference to a memory arena, and a `JsValue` respectively.
//! 5. There are some call-stack shenanigans to try and make it harder for adversaries to
//!    deserialize the escape-hatch wrapper struct from outside the [`trusted`]
//!    submodule of this module. This is done because any sequence of the form
//!    `(MAGIC_STRING, 0_usize, u32)` could behave as a deserializer and instantly
//!    cause UB by making me cast 0_usize to an &`Bump`. It is probably impossible
//!    to do this, but I am unable to generally prove it at the moment.
mod trusted;
mod arena;
mod jsvalue;
use crate::deserializer::{
    Deserializer,
    escape_hatches::{
        trusted::visit_preserve_escape_hatch, arena::ARENA_ESCAPE_HATCH_VALUE_MAGIC,
        jsvalue::SERDE_WASM_BINDGEN_VALUE_MAGIC,
    },
};
use trusted::visit_arena_escape_hatch;
use std::ops::ControlFlow;
mod r#macro;
pub(super) use arena::deserialize_arena_and_js_value;

/// Given the name of a tuple struct, see if it matches a magic string.
/// 
/// If it does, interpret that as the visitor expecting a (usize, u32)
/// that corresponds to a type-erased (&Bump, JsValue) from the given
/// `deserializer`.
/// 
/// Otherwise, regurgitate the non-copy arguments.
pub fn try_deserialize_escape_hatches<'de, V>(
    de: Deserializer<'de>,
    name: &'static str,
    visitor: V,
) -> ControlFlow<
    Result<V::Value, serde_wasm_bindgen::Error>,
    (Deserializer<'de>, V),
>
where
    V: serde::de::Visitor<'de>,
{
    if name == SERDE_WASM_BINDGEN_VALUE_MAGIC {
        return ControlFlow::Break(visit_preserve_escape_hatch(visitor, de.value));
    }
    if name == ARENA_ESCAPE_HATCH_VALUE_MAGIC {
        return ControlFlow::Break(visit_arena_escape_hatch(visitor, de.arena, de.value));
    }
    ControlFlow::Continue((de, visitor))
}
