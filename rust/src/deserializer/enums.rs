//! Implementation of `Deserializer::deserialize_enum` for the parent module.
//! 
//! Ripped from [`serde_wasm_bindgen`],
//! except the reference to the memory arena is propagated.
use crate::deserializer::{
    Deserializer,
    common::{as_object_entries, convert_pair, invalid_type},
};
use bumpalo::Bump;
use serde::Deserializer as _;
use wasm_bindgen::JsValue;

/// Implementation of `Deserializer::deserialize_enum` for the parent module.
/// 
/// Ripped from [`serde_wasm_bindgen`], except with a memory arena.
pub fn deserialize_enum<'de, V>(
    value: JsValue,
    arena: &'de Bump,
    visitor: V,
) -> Result<V::Value, serde_wasm_bindgen::Error>
where
    V: serde::de::Visitor<'de>,
{
    let access = if value.is_string() {
        EnumAccess {
            tag: value,
            payload: JsValue::UNDEFINED.into(),
            arena,
        }
    } else if let Some(entries) = as_object_entries(&value) {
        if entries.length() != 1 {
            return Err(serde::de::Error::invalid_length(
                entries.length() as _,
                &"1",
            ));
        }
        let entry = entries.get(0);
        let (tag, payload) = convert_pair(entry);
        EnumAccess {
            tag,
            payload,
            arena,
        }
    } else {
        return Err(invalid_type(value, arena, &visitor))
    };
    visitor.visit_enum(access)
}
/// Implements [`serde::de::EnumAccess`].
/// 
/// Ripped from [`serde_wasm_bindgen`], except with a memory arena.
struct EnumAccess<'a> {
    tag: JsValue,
    payload: JsValue,
    arena: &'a Bump,
}

impl<'de> serde::de::EnumAccess<'de> for EnumAccess<'de> {
    type Error = serde_wasm_bindgen::Error;
    type Variant = Deserializer<'de>;

    fn variant_seed<V: serde::de::DeserializeSeed<'de>>(
        self,
        seed: V,
    ) -> Result<(V::Value, Self::Variant), serde_wasm_bindgen::Error> {
        Ok((
            seed.deserialize(Deserializer {
                arena: self.arena,
                value: self.tag,
            })?,
            Deserializer {
                arena: self.arena,
                value: self.payload,
            },
        ))
    }
}
impl<'de> serde::de::VariantAccess<'de> for Deserializer<'de> {
    type Error = serde_wasm_bindgen::Error;

    fn unit_variant(self) -> Result<(), Self::Error> {
        serde::de::Deserialize::deserialize(self)
    }

    fn newtype_variant_seed<T: serde::de::DeserializeSeed<'de>>(
        self,
        seed: T,
    ) -> Result<T::Value, Self::Error> {
        seed.deserialize(self)
    }

    fn tuple_variant<V: serde::de::Visitor<'de>>(
        self,
        len: usize,
        visitor: V,
    ) -> Result<V::Value, serde_wasm_bindgen::Error> {
        
        self.deserialize_tuple(len, visitor)
    }

    fn struct_variant<V: serde::de::Visitor<'de>>(
        self,
        fields: &'static [&'static str],
        visitor: V,
    ) -> Result<V::Value, serde_wasm_bindgen::Error> {
        self.deserialize_struct("", fields, visitor)
    }
}
