//! A module defining a deserializer that uses a memory arena
//! to eliminate time spent de-allocating strings and vectors
//! of elements.
//! 
//! The main utility defined is [`deserialize`].
//! 
//! There are also helpful slice/vec deserialization functions
//! [`deserialize_leaked_slice_into_arena`] and [`deserialize_vec_into_arena`],
//! which are meant to be used with `#[derive(Deserialize)]` but only
//! if you're using this module's [`deserialize`] function.
use bumpalo::Bump;
use serde::{Deserialize, de::IntoDeserializer};
use std::ops::ControlFlow;
use wasm_bindgen::{JsCast, JsValue};
use web_sys::js_sys::{Array, Map, Number, Symbol};
mod common;
mod enums;
mod escape_hatches;
mod maps;
mod seqs;
mod slices;
mod strings;
mod structs;

use crate::deserializer::{
    common::{as_vec, invalid_type, is_nullish, leak_vec},
    enums::deserialize_enum,
    escape_hatches::try_deserialize_escape_hatches,
    maps::deserialize_map,
    seqs::deserialize_seq,
    strings::{deserialize_borrowed_str, deserialize_str, deserialize_string},
    structs::deserialize_struct,
};
pub use slices::{deserialize_leaked_slice_into_arena, deserialize_vec_into_arena};
/// Deserialize a [`JsValue`] using the given `arena` to allocate strings and buffers.
/// 
/// The lifetime of the slice/string data returned can depend on the arena passed in.
pub fn deserialize<'de, D: Deserialize<'de>>(value: JsValue, arena: &'de Bump) -> Result<D, serde_wasm_bindgen::Error> {
    D::deserialize(Deserializer {
        value,
        arena
    })
}
/// A deserializer that aims to copy the behaviour of
/// [`serde_wasm_bindgen::Deserializer`] but using a memory
/// arena to allocate strings and buffers.
struct Deserializer<'a> {
    arena: &'a Bump,
    value: JsValue,
}
/// Shorthand for delegating to [`serde_wasm_bindgen::Deserializer`] methods.
macro_rules! derive_serde_wasm_bindgen_deserializer {
    ($($member:ident),+) => {
        $(fn $member<V>(self, visitor: V) -> Result<V::Value, Self::Error>
        where
            V: serde::de::Visitor<'de> {
            serde_wasm_bindgen::Deserializer::from(self.value).$member(visitor)
        })+
    };
}

impl<'de> serde::Deserializer<'de> for Deserializer<'de> {
    type Error = serde_wasm_bindgen::Error;

    // Copied from [`serde_wasm_bindgen::Deserializer`].
    fn deserialize_any<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        if is_nullish(&self.value) {
            // Ideally we would only treat `undefined` as `()` / `None` which would be semantically closer
            // to JS definitions, but, unfortunately, WebIDL generates missing values as `null`
            // and we probably want to support these as well.
            visitor.visit_unit()
        } else if let Some(v) = self.value.as_bool() {
            visitor.visit_bool(v)
        } else if self.value.is_bigint() {
            match i64::try_from(self.value) {
                Ok(v) => visitor.visit_i64(v),
                Err(value) => match u64::try_from(value) {
                    Ok(v) => visitor.visit_u64(v),
                    Err(_) => Err(serde::de::Error::custom(
                        "Couldn't deserialize i64 or u64 from a BigInt outside i64::MIN..u64::MAX bounds",
                    )),
                },
            }
        } else if let Some(v) = self.value.as_f64() {
            if Number::is_safe_integer(&self.value) {
                visitor.visit_i64(v as i64)
            } else {
                visitor.visit_f64(v)
            }
        } else if let Some(v) = self.value.as_string() {
            visitor.visit_string(v)
        } else if Array::is_array(&self.value) {
            self.deserialize_seq(visitor)
        } else if let Some(buf) = as_vec(&self.value, self.arena) {
            // We need to handle this here because serde uses `deserialize_any`
            // for internally tagged enums
            visitor.visit_borrowed_bytes(leak_vec(buf))
        } else if self.value.is_object() &&
            // The only reason we want to support objects here is because serde uses
            // `deserialize_any` for internally tagged enums
            // (see https://github.com/RReverser/serde-wasm-bindgen/pull/4#discussion_r352245020).
            //
            // We expect such enums to be represented via plain JS objects, so let's explicitly
            // exclude Sets and other iterables. These should be deserialized via concrete
            // `deserialize_*` methods instead of us trying to guess the right target type.
            //
            // We still do support Map, so that the format described here stays a self-describing
            // format: we happen to serialize to Map, and it is not ambiguous.
            //
            // Hopefully we can rid of these hacks altogether once
            // https://github.com/serde-rs/serde/issues/1183 is implemented / fixed on serde side.
            (!Symbol::iterator().js_in(&self.value) || self.value.has_type::<Map>())
        {
            self.deserialize_map(visitor)
        } else {
            Err(invalid_type(self.value, self.arena, &visitor))
        }
    }

    derive_serde_wasm_bindgen_deserializer! {
        deserialize_bool,
        deserialize_i8,
        deserialize_i16,
        deserialize_i32,
        deserialize_i64,
        deserialize_i128,
        deserialize_u8,
        deserialize_u16,
        deserialize_u32,
        deserialize_u64,
        deserialize_u128,
        deserialize_f32,
        deserialize_f64,
        deserialize_char,
        deserialize_unit,
        deserialize_ignored_any,
        deserialize_byte_buf
    }

    fn deserialize_str<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        deserialize_borrowed_str(self.value, self.arena, visitor)
    }

    fn deserialize_string<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        deserialize_string(self.value, self.arena, visitor)
    }

    fn deserialize_identifier<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        deserialize_str(self.value, self.arena, visitor)
    }

    fn deserialize_bytes<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        match as_vec(&self.value, self.arena) {
            Some(v) => visitor.visit_borrowed_bytes(leak_vec(v)),
            None => Err(invalid_type(self.value, self.arena, &visitor)),
        }
    }

    fn deserialize_option<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        if !is_nullish(&self.value) {
            visitor.visit_some(self)
        } else {
            visitor.visit_none()
        }
    }

    fn deserialize_unit_struct<V>(
        self,
        _name: &'static str,
        visitor: V,
    ) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        self.deserialize_unit(visitor)
    }

    fn deserialize_newtype_struct<V>(
        self,
        _name: &'static str,
        visitor: V,
    ) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        visitor.visit_newtype_struct(self)
    }

    fn deserialize_seq<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        deserialize_seq(self.value, self.arena, visitor)
    }

    fn deserialize_tuple<V>(self, _len: usize, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        self.deserialize_seq(visitor)
    }

    fn deserialize_tuple_struct<V>(
        self,
        name: &'static str,
        len: usize,
        visitor: V,
    ) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        match try_deserialize_escape_hatches(self, name, visitor) {
            ControlFlow::Break(r) => r,
            ControlFlow::Continue((this, visitor)) => this.deserialize_tuple(len, visitor),
        }
    }

    fn deserialize_map<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        deserialize_map(self.value, self.arena, visitor)
    }

    fn deserialize_struct<V>(
        self,
        _name: &'static str,
        fields: &'static [&'static str],
        visitor: V,
    ) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        deserialize_struct(self.value, self.arena, fields, visitor)
    }

    fn deserialize_enum<V>(
        self,
        _name: &'static str,
        _variants: &'static [&'static str],
        visitor: V,
    ) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        deserialize_enum(self.value, self.arena, visitor)
    }
}
impl<'de> IntoDeserializer<'de, serde_wasm_bindgen::Error> for Deserializer<'de> {
    type Deserializer = Self;
    fn into_deserializer(self) -> Self::Deserializer {
        self
    }
}
