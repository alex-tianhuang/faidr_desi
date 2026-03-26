//! Implementation of `Deserializer::deserialize_map` for the parent module.
//! 
//! Ripped from [`serde_wasm_bindgen`],
//! except the reference to the memory arena is propagated.
use crate::deserializer::{
    Deserializer,
    common::{as_object_entries, convert_pair, invalid_type},
};
use bumpalo::Bump;
use serde::de::value::MapDeserializer;
use wasm_bindgen::{JsValue, UnwrapThrowExt};
use web_sys::js_sys;

/// Implementation of `Deserializer::deserialize_seq` for the parent module.
/// 
/// Ripped from [`serde_wasm_bindgen`], except with a memory arena.
pub fn deserialize_map<'de, V>(
    value: JsValue,
    arena: &'de Bump,
    visitor: V,
) -> Result<V::Value, serde_wasm_bindgen::Error>
where
    V: serde::de::Visitor<'de>,
{
    if let Some(iter) = js_sys::try_iter(&value)? {
        return visitor.visit_map(MapAccess {
            iter,
            next_value: None,
            arena,
        });
    }
    match as_object_entries(&value) {
        Some(entries) => visitor.visit_map(MapDeserializer::new(entries.iter().map(|pair| {
            let (key, value) = convert_pair(pair);
            (
                Deserializer { arena, value: key },
                Deserializer { arena, value },
            )
        }))),
        None => Err(invalid_type(value, arena, &visitor)),
    }
}
/// Implements [`serde::de::MapAccess`].
/// 
/// Ripped from [`serde_wasm_bindgen`], except with a memory arena.
struct MapAccess<'a> {
    iter: js_sys::IntoIter,
    next_value: Option<JsValue>,
    arena: &'a Bump,
}

impl<'de> serde::de::MapAccess<'de> for MapAccess<'de> {
    type Error = serde_wasm_bindgen::Error;

    fn next_key_seed<K: serde::de::DeserializeSeed<'de>>(
        &mut self,
        seed: K,
    ) -> Result<Option<K::Value>, serde_wasm_bindgen::Error> {
        debug_assert!(self.next_value.is_none());
        let notification = self.iter.next().transpose()?;
        let return_value = match notification {
            Some(pair) => {
                let (key, value) = convert_pair(pair);
                self.next_value = Some(value);
                Some(seed.deserialize(Deserializer {
                    arena: self.arena,
                    value: key,
                })?)
            }
            None => None,
        };
        Ok(return_value)
    }

    fn next_value_seed<V: serde::de::DeserializeSeed<'de>>(
        &mut self,
        seed: V,
    ) -> Result<V::Value, serde_wasm_bindgen::Error> {
        let value = self.next_value.take().unwrap_throw();
        seed.deserialize(Deserializer {
            arena: self.arena,
            value,
        })
    }
}
