//! Module defining [`PseudoMap`].
use serde::{Deserialize, Serialize, Serializer};
use std::{
    collections::HashSet,
    fmt::Display,
    marker::PhantomData,
    ops::{Deref, DerefMut},
};

use crate::utils::cautious;

/// Wrapper for [`Vec`].
///
/// `Vec` of (key, value) pairs that deserializes
/// and serializes like a (string, value) map on the
/// JS side.
///
/// Used in situations where a rust-side lookup by key
/// is never performed but the serialized JS format
/// should look like a map. Probably premature optimization,
/// but oh well!
///
/// Serializing this stringifies keys.
pub struct PseudoMap<K, V>(Vec<(K, V)>);
impl<K, V> Default for PseudoMap<K, V> {
    fn default() -> Self {
        Self(Vec::default())
    }
}
impl<'de, V: Deserialize<'de>> Deserialize<'de> for PseudoMap<String, V> {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        struct Visitor<V> {
            __phantom: PhantomData<(String, V)>,
        }
        impl<'de, V: Deserialize<'de>> serde::de::Visitor<'de> for Visitor<V> {
            type Value = PseudoMap<String, V>;
            fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
                formatter.write_str("a map")
            }
            fn visit_map<A>(self, mut map: A) -> Result<Self::Value, A::Error>
            where
                A: serde::de::MapAccess<'de>,
            {
                let mut buf = Vec::with_capacity(cautious(map.size_hint()));
                while let Some((key, value)) = map.next_entry::<String, V>()? {
                    buf.push((key, value))
                }
                let mut seen = HashSet::with_capacity(buf.len());
                let mut dup_idxs = Vec::new();
                for (idx, (k, _)) in buf.iter().enumerate().rev() {
                    if !seen.insert(&**k) {
                        dup_idxs.push(idx);
                    }
                }
                let mut dup_idxs_iter = dup_idxs.into_iter().rev().peekable();
                let mut idx = 0;
                buf.retain(|_| {
                    let b = dup_idxs_iter.next_if(|dup_idx| *dup_idx == idx).is_none();
                    idx += 1;
                    b
                });
                Ok(PseudoMap(buf))
            }
        }
        deserializer.deserialize_map(Visitor {
            __phantom: PhantomData,
        })
    }
}
impl<K: Display, V: Serialize> Serialize for PseudoMap<K, V> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.collect_map(self.0.iter().map(|(k, v)| (k.to_string(), v)))
    }
}
impl<K, V> Deref for PseudoMap<K, V> {
    type Target = Vec<(K, V)>;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
impl<K, V> DerefMut for PseudoMap<K, V> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}
impl<K, V> FromIterator<(K, V)> for PseudoMap<K, V> {
    fn from_iter<I: IntoIterator<Item = (K, V)>>(iter: I) -> Self {
        PseudoMap(Vec::from_iter(iter))
    }
}
impl<K, V> From<Vec<(K, V)>> for PseudoMap<K, V> {
    fn from(value: Vec<(K, V)>) -> Self {
        Self(value)
    }
}
