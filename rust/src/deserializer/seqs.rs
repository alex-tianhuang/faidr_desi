//! Implementation of `Deserializer::deserialize_seq` for the parent module.
//! 
//! Ripped from [`serde_wasm_bindgen`],
//! except the reference to the memory arena is propagated.
use crate::deserializer::{Deserializer, common::invalid_type};
use bumpalo::Bump;
use serde::de::value::SeqDeserializer;
use wasm_bindgen::{JsCast, JsValue};
use web_sys::js_sys::{self, Array};

/// Implementation of `Deserializer::deserialize_struct` for the parent module.
/// 
/// Ripped from [`serde_wasm_bindgen`], except with a memory arena.
pub fn deserialize_seq<'de, V>(
    value: JsValue,
    arena: &'de Bump,
    visitor: V,
) -> Result<V::Value, serde_wasm_bindgen::Error>
where
    V: serde::de::Visitor<'de>,
{
    if let Some(arr) = value.dyn_ref::<Array>() {
        visitor.visit_seq(SeqDeserializer::new(
            arr.iter().map(|value| Deserializer { arena, value }),
        ))
    } else if let Some(iter) = js_sys::try_iter(&value)? {
        visitor.visit_seq(SeqAccess { iter, arena })
    } else {
        Err(invalid_type(value, arena, &visitor))
    }
}
/// Implements [`serde::de::SeqAccess`].
/// 
/// Ripped from [`serde_wasm_bindgen`], except with a memory arena.
struct SeqAccess<'a> {
    iter: js_sys::IntoIter,
    arena: &'a Bump,
}
impl<'de> serde::de::SeqAccess<'de> for SeqAccess<'de> {
    type Error = serde_wasm_bindgen::Error;

    fn next_element_seed<T: serde::de::DeserializeSeed<'de>>(
        &mut self,
        seed: T,
    ) -> Result<Option<T::Value>, serde_wasm_bindgen::Error> {
        let notification = self.iter.next().transpose()?;
        let return_value = match notification {
            Some(item) => Some(seed.deserialize(Deserializer {
                arena: self.arena,
                value: item,
            })?),
            None => None,
        };
        Ok(return_value)
    }
}
