//! Some common utilities involving a [`JsValue`] and a memory arena.
//! 
//! These are ripped from methods on [`serde_wasm_bindgen::Deserializer`].
//! I just thought it looked cleaner if my deserializer struct only had
//! methods related to the [`serde::de::Deserializer`] trait, so I factored
//! these out into regular functions rather than members.
use bumpalo::{Bump, collections::Vec};
use std::mem::{self, ManuallyDrop};
use wasm_bindgen::{JsCast, JsValue};
use web_sys::js_sys::{Array, ArrayBuffer, Object, Uint8Array};

/// Describe the current `value`, which is not expected.
/// 
/// Returned on all paths involving type failure.
#[cold]
pub fn invalid_type(value: JsValue, arena: &Bump, visitor: &dyn serde::de::Expected) -> serde_wasm_bindgen::Error {
    let string;
    let bytes;

    let unexpected = if is_nullish(&value) {
        serde::de::Unexpected::Unit
    } else if let Some(v) = value.as_bool() {
        serde::de::Unexpected::Bool(v)
    } else if let Some(v) = value.as_f64() {
        serde::de::Unexpected::Float(v)
    } else if let Some(v) = value.as_string() {
        string = v;
        serde::de::Unexpected::Str(&string)
    } else if let Some(v) = as_vec(&value, arena) {
        bytes = v;
        serde::de::Unexpected::Bytes(&bytes)
    } else {
        string = format!("{:?}", value);
        serde::de::Unexpected::Other(&string)
    };

    serde::de::Error::invalid_type(unexpected, visitor)
}
/// Check if a value is null or undefined.
pub fn is_nullish(value: &JsValue) -> bool {
    value.loose_eq(&JsValue::NULL)
}
/// Assert that the passed in `pair` is an array in JS
/// and destructure it (e.g. like `const [one, two] = pair`).
pub fn convert_pair(pair: JsValue) -> (JsValue, JsValue) {
    let pair = pair.unchecked_into::<Array>();
    (pair.get(0), pair.get(1))
}
/// If the provided value is an object, return its
/// [`Object::entries`].
pub fn as_object_entries(value: &JsValue) -> Option<Array> {
    if value.is_object() {
        Some(Object::entries(value.unchecked_ref()))
    } else {
        None
    }
}
/// If the given `value` can be converted into a `Uint8Array`,
/// then allocate it into the arena as a temporary `Vec`.
pub fn as_vec<'a>(value: &JsValue, arena: &'a Bump) -> Option<Vec<'a, u8>> {
    let temp;

    let v = if let Some(v) = value.dyn_ref::<Uint8Array>() {
        v
    } else if let Some(v) = value.dyn_ref::<ArrayBuffer>() {
        temp = Uint8Array::new(v);
        &temp
    } else {
        return None;
    };
    let len = v.length() as usize;
    let mut buf = Vec::with_capacity_in(len, arena);
    // SAFETY: the capacity is at least `len`
    //         and bytes have no initialization requirements
    unsafe { buf.set_len(len) };
    v.copy_to(&mut buf);
    Some(buf)
}
/// Leak a [`Vec`] managed by an arena into a slice
/// that lives for as long as the arena does not reset.
/// The slice ref is mutable because it is unique, but you
/// can obviously treat this as an immutable slice if
/// you want.
///
/// Dev note
/// --------
/// As of Feb 26th, 2026, the bump arena grows left while
/// the `Vec` type grows right, so any call to [`Vec::shrink_to_fit`]
/// that non-trivially shrinks the allocation necessarily
/// results in a linear time clone.
/// 
/// Call [`Vec::shrink_to_fit`] if the memory saved is worth
/// the clone. Otherwise it's probably ok to leak it all.
pub fn leak_vec<'a, T>(buf: Vec<'a, T>) -> &'a mut [T] {
    let mut buf = ManuallyDrop::new(buf);
    // SAFETY: the arena must de-allocate before this vec does.
    //         Also, do to the use of `ManuallyDrop`, these bytes
    //         are not de-allocated and reused by the arena.
    unsafe { mem::transmute::<&mut [T], &'a mut [T]>(buf.as_mut_slice()) }
}
