//! Module for deserializing slices when the deserializer lifetime
//! is associated to a memory arena.
//!
//! The functions in this module [`deserialize_vec_into_arena`]
//! and [`deserialize_leaked_slice_into_arena`] are meant to integrate with
//! `#[serde(deserialize_with = ...)]`.
//!
//! However, the requirement that the deserializer be tied to an allocator
//! means that using these functions in your serde derive locks you into
//! using the [`deserialize`] function (as defined in this crate).
//! Attempting to deserialize slices/vectors in this way with any other
//! deserializer will instantly fail with an error that says it is expecting:
//! "a specific internal `Deserializer` with a memory arena and a `JsValue`"
//!
//! [`deserialize`]: crate::deserializer::deserialize
use crate::{
    cautious,
    deserializer::{
        Deserializer, common::leak_vec, escape_hatches::deserialize_arena_and_js_value,
    },
};
use bumpalo::{Bump, collections::Vec};
use serde::{Deserialize, Deserializer as _, de::Visitor};
use std::marker::PhantomData;

/// Deserialize a sequence of data into a [`Vec`],
/// managed by some memory arena. Code should pass in the
/// memory arena when it calls [`deserialize`].
///
/// It is assumed that the caller is using the [`deserialize`]
/// function to deserialize structs that are serde-derived
/// with this function. Using an arbitrary deserializer will
/// cause deserialization to fail expecting the internal
/// [`Deserializer`] type.
///
/// [`deserialize`]: crate::deserializer::deserialize
pub fn deserialize_vec_into_arena<'de, D, T: Deserialize<'de>>(
    deserializer: D,
) -> Result<Vec<'de, T>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    pub struct VecVisitor<'a, T> {
        arena: &'a Bump,
        __phantom: PhantomData<T>,
    }

    impl<'de, T: Deserialize<'de> + 'de> Visitor<'de> for VecVisitor<'de, T> {
        type Value = Vec<'de, T>;
        fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
            formatter.write_str("a sequence")
        }
        fn visit_seq<A>(self, mut seq: A) -> Result<Self::Value, A::Error>
        where
            A: serde::de::SeqAccess<'de>,
        {
            let mut values = Vec::with_capacity_in(cautious(seq.size_hint()), self.arena);
            while let Some(value) = seq.next_element()? {
                values.push(value);
            }
            Ok(values)
        }
    }
    let (arena, value) = deserialize_arena_and_js_value(deserializer)?;
    Deserializer { arena, value }
        .deserialize_seq(VecVisitor {
            arena,
            __phantom: PhantomData,
        })
        .map_err(serde::de::Error::custom)
}
/// Deserialize a sequence of data into a slice,
/// which is leaked into a memory arena until that arena
/// is reset. Code should pass in the memory arena when it
/// calls [`deserialize`].
///
/// The slice is mutable because it is unique, but you
/// can obviously treat this as an immutable slice if
/// you want.
///
/// Deserializing into slices is usually preferred to deserializing
/// into `Vec`s (see [`deserialize_vec_into_arena`]) because it
/// leaves the de-allocation to the memory arena. Therefore if
/// you are deserializing a lot of buffers that you know will all
/// be immutable and de-allocated at once, use this function over
/// the `Vec` based one.
///
/// It is assumed that the caller is using the [`deserialize`]
/// function to deserialize structs that are serde-derived
/// with this function. Using an arbitrary deserializer will
/// cause deserialization to fail expecting the internal
/// [`Deserializer`] type.
///
/// [`deserialize`]: crate::deserializer::deserialize
pub fn deserialize_leaked_slice_into_arena<'de, D, T: Deserialize<'de> + Copy>(
    deserializer: D,
) -> Result<&'de mut [T], D::Error>
where
    D: serde::Deserializer<'de>,
{
    deserialize_vec_into_arena(deserializer).map(leak_vec)
}
