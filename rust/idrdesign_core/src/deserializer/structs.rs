//! Implementation of `Deserializer::deserialize_struct` for the parent module.
//! 
//! Ripped from [`serde_wasm_bindgen`],
//! except the reference to the memory arena is propagated.
use bumpalo::Bump;
use serde::de::{value::StrDeserializer};
use wasm_bindgen::{JsCast, JsValue, UnwrapThrowExt, prelude::wasm_bindgen};
use web_sys::js_sys::JsString;
use crate::deserializer::Deserializer;
use crate::deserializer::common::invalid_type;

/// Implementation of `Deserializer::deserialize_struct` for the parent module.
/// 
/// Ripped from [`serde_wasm_bindgen`], except with a memory arena.
pub fn deserialize_struct<'de, V>(value: JsValue, arena: &'de Bump, fields: &'static [&'static str], visitor: V) -> Result<V::Value, serde_wasm_bindgen::Error> where V: serde::de::Visitor<'de> {
    let obj = if value.is_object() {
        value.unchecked_into::<ObjectExt>()
    } else {
        return Err(invalid_type(value, arena, &visitor))
    };
    visitor.visit_map(ObjectAccess { obj, fields: fields.iter(), next_value: None, arena })
}
/// Implements [`serde::de::MapAccess`].
/// 
/// Ripped from [`serde_wasm_bindgen`], except with a memory arena.
struct ObjectAccess<'a> {
    obj: ObjectExt,
    fields: std::slice::Iter<'static, &'static str>,
    next_value: Option<JsValue>,
    arena: &'a Bump
}

impl<'de> serde::de::MapAccess<'de> for ObjectAccess<'de> {
    type Error = serde_wasm_bindgen::Error;

    fn next_key_seed<K: serde::de::DeserializeSeed<'de>>(&mut self, seed: K) -> Result<Option<K::Value>, serde_wasm_bindgen::Error> {
        debug_assert!(self.next_value.is_none());

        for field in &mut self.fields {
            let js_field = static_str_to_js(field);
            let next_value = self.obj.get_with_ref_key(&js_field);
            // If this value is `undefined`, it might be actually a missing field;
            // double-check with an `in` operator if so.
            let is_missing_field = next_value.is_undefined() && !js_field.js_in(&self.obj);
            if !is_missing_field {
                self.next_value = Some(next_value);
                return Ok(Some(seed.deserialize(<StrDeserializer<serde_wasm_bindgen::Error>>::new(field))?));
            }
        }

        Ok(None)
    }

    fn next_value_seed<V: serde::de::DeserializeSeed<'de>>(&mut self, seed: V) -> Result<V::Value, serde_wasm_bindgen::Error> {
        let value = self.next_value.take().unwrap_throw();
        seed.deserialize(Deserializer { arena: self.arena, value })
    }
}

/// Because [`JsString`]s are needed to use index-getters in JS,
/// convert a rust `&'static str` to a `JsString` using a memo.
/// 
/// Ripped verbatim from [`serde_wasm_bindgen`].
fn static_str_to_js(s: &'static str) -> JsString {
    use std::cell::RefCell;
    use std::collections::HashMap;

    #[derive(Default)]
    struct PtrHasher {
        addr: usize,
    }

    impl std::hash::Hasher for PtrHasher {
        fn write(&mut self, _bytes: &[u8]) {
            unreachable!();
        }

        fn write_usize(&mut self, addr_or_len: usize) {
            if self.addr == 0 {
                self.addr = addr_or_len;
            }
        }

        fn finish(&self) -> u64 {
            self.addr as _
        }
    }

    type PtrBuildHasher = std::hash::BuildHasherDefault<PtrHasher>;

    thread_local! {
        // Since we're mainly optimising for converting the exact same string literal over and over again,
        // which will always have the same pointer, we can speed things up by indexing by the string's pointer
        // instead of its value.
        static CACHE: RefCell<HashMap<*const str, JsString, PtrBuildHasher>> = Default::default();
    }
    CACHE.with(|cache| {
        cache
            .borrow_mut()
            .entry(s)
            .or_insert_with(|| s.into())
            .clone()
    })
}

/// Ripped verbatim from [`serde_wasm_bindgen`].
#[wasm_bindgen]
extern "C" {
    type ObjectExt;

    /// Equivalent to calling `this[key]`.
    /// 
    /// Could throw but in 99% of cases this is probably fine.
    #[wasm_bindgen(method, indexing_getter)]
    fn get_with_ref_key(this: &ObjectExt, key: &JsString) -> JsValue;
}