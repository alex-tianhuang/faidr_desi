//! Module defining some string deserialization implementations
//! that use a memory arena for allocation.
use bumpalo::{Bump, collections::String};
use std::mem::{self, ManuallyDrop};
use wasm_bindgen::{JsCast, JsValue};
use web_sys::js_sys::JsString;
use crate::deserializer::common::invalid_type;

/// Deserialize an `str` that can last as long as the given arena does.
pub fn deserialize_borrowed_str<'de, V>(
    value: JsValue,
    arena: &'de Bump,
    visitor: V,
) -> Result<V::Value, serde_wasm_bindgen::Error>
where
    V: serde::de::Visitor<'de>,
{
    match value.dyn_ref::<JsString>() {
        Some(s) => {
            let buf = js_string_to_rust_lossy(s, arena);
            visitor.visit_borrowed_str(leak_string(buf))
        }
        None => Err(invalid_type(value, arena, &visitor))
    }
}

/// Deserialize an owned `String` (managed by the global allocator).
pub fn deserialize_string<'de, V>(
    value: JsValue,
    arena: &Bump,
    visitor: V,
) -> Result<V::Value, serde_wasm_bindgen::Error>
where
    V: serde::de::Visitor<'de>,
{
    match value.dyn_ref::<JsString>() {
        Some(s) => visitor.visit_string(js_string_to_rust_global_string_lossy(s)),
        None => Err(invalid_type(value, arena, &visitor))
    }
}

/// Deserialize a value that needs access to a temporary `str`,
/// the space for which will be provided by the given arena.
pub fn deserialize_str<'de, V>(
    value: JsValue,
    arena: &Bump,
    visitor: V,
) -> Result<V::Value, serde_wasm_bindgen::Error>
where
    V: serde::de::Visitor<'de>,
{
    match value.dyn_ref::<JsString>() {
        Some(s) => {
            let buf = js_string_to_rust_lossy(s, arena);
            visitor.visit_str(buf.as_str())
        }
        None => Err(invalid_type(value, arena, &visitor))
    }
}

/// Read a string from JS into the given arena,
/// converting all lone surrogates to `char::REPLACEMENT_CHARACTER`.
fn js_string_to_rust_lossy<'a, 'b>(s: &'a JsString, arena: &'b Bump) -> String<'b> {
    // `s.length()` = # code units >= # of 2-4 byte things representing one `char`
    let byte_length_lower_bound = s.length() as usize;
    let mut buf = String::with_capacity_in(byte_length_lower_bound, arena);
    buf.extend(char::decode_utf16(s.iter()).map(|r| r.unwrap_or(char::REPLACEMENT_CHARACTER)));
    buf
}
/// Read a string from JS into a string managed by the global allocator,
/// converting all lone surrogates to `char::REPLACEMENT_CHARACTER`.
fn js_string_to_rust_global_string_lossy(s: &JsString) -> std::string::String {
    // `s.length()` = # code units >= # of 2-4 byte things representing one `char`
    let byte_length_lower_bound = s.length() as usize;
    let mut buf = std::string::String::with_capacity(byte_length_lower_bound);
    buf.extend(char::decode_utf16(s.iter()).map(|r| r.unwrap_or(char::REPLACEMENT_CHARACTER)));
    buf
}
/// Leak a [`String`] managed by an arena into a [`str`]
/// that lives for as long as the arena does not reset.
///
/// Dev note
/// --------
/// As of Feb 26th, 2026, the bump arena grows left while
/// the `Vec` type grows right, so any call to [`String::shrink_to_fit`]
/// that non-trivially shrinks the allocation necessarily
/// results in a linear time clone. 
/// 
/// Call [`String::shrink_to_fit`] if the memory saved is worth
/// the clone. Otherwise it's probably ok to leak it all.
fn leak_string<'a>(buf: String<'a>) -> &'a str {
    let buf = ManuallyDrop::new(buf);
    // SAFETY: the arena must de-allocate before these bytes do.
    //         Also, do to the use of `ManuallyDrop`, these bytes
    //         are not de-allocated and reused by the arena.
    unsafe { mem::transmute::<&str, &'a str>(buf.as_str()) }
}
