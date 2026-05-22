//! Module defining a generic owned aminoacid string, [`AACanonicalString`].
use crate::datatypes::{
    Aminoacid,
    sequences::aastring::borrowed::{NotAAStrError, aa_canonical_str},
};
use serde::{Deserialize, Deserializer, Serialize};
use std::{mem::ManuallyDrop, ops::Deref};

/// String of aminoacid-like bytes in owned form.
///
/// This is essentially just a wrapper around `Vec`
/// that can be treated as a valid UTF-8 string sometimes.
///
/// See also [`aa_canonical_str`].
#[derive(Clone)]
pub struct AACanonicalString(Vec<Aminoacid>);

impl AACanonicalString {
    /// Make a new [`AACanonicalString`] from a vector of `Aminoacid`s.
    pub fn new(buf: Vec<Aminoacid>) -> Self {
        Self(buf)
    }
    /// Make a new [`AACanonicalString`] from a vector of any bytes.
    pub fn from_bytes(buf: Vec<u8>) -> Result<Self, NotAAStrError> {
        let _: &aa_canonical_str = aa_canonical_str::from_bytes(&buf)?;
        // SAFETY: just checked that the bytes are all aminoacids.
        unsafe { Ok(Self::from_bytes_unchecked(buf)) }
    }
    /// Make a new [`AACanonicalString`] from a vector of bytes,
    /// without checking those bytes are aminoacids.
    ///
    /// Safety
    /// ------
    /// You must be sure that all bytes in `buf` are valid
    /// aminoacids.
    pub unsafe fn from_bytes_unchecked(buf: Vec<u8>) -> Self {
        let mut buf = ManuallyDrop::new(buf);
        let ptr = buf.as_mut_ptr().cast::<Aminoacid>();
        let len = buf.len();
        let cap = buf.capacity();
        unsafe { Self(Vec::from_raw_parts(ptr, len, cap)) }
    }
}
impl AsMut<Vec<Aminoacid>> for AACanonicalString {
    fn as_mut(&mut self) -> &mut Vec<Aminoacid> {
        &mut self.0
    }
}
impl Deref for AACanonicalString {
    type Target = aa_canonical_str;
    fn deref(&self) -> &Self::Target {
        aa_canonical_str::new(&self.0)
    }
}
impl Serialize for AACanonicalString {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.as_str().serialize(serializer)
    }
}
impl<'de> Deserialize<'de> for AACanonicalString {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        AACanonicalString::from_bytes(s.into_bytes()).map_err(serde::de::Error::custom)
    }
}
