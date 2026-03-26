//! Module defining a generic owned aminoacid string, [`AAString`].
use crate::datatypes::sequences::aastring::generic::{
    AALike,
    borrowed::{NotAAStrError, aa_str},
};
use serde::{Deserialize, Deserializer, Serialize};
use std::{
    borrow::Borrow,
    mem::ManuallyDrop,
    ops::{Deref, DerefMut},
};

/// String of aminoacid-like bytes in owned form.
///
/// Generic over a subset of aminoacids, which I will call
/// type `A` in the docs.
///
/// This is essentially just a wrapper around `Vec`
/// that can be treated as a valid UTF-8 string sometimes.
///
/// See also [`aa_str`].
#[derive(Clone)]
pub struct AAString<A>(Vec<A>);

impl<A: AALike> AAString<A> {
    /// Make a new [`AAString`] from a vector of `A`-bytes.
    pub fn new(buf: Vec<A>) -> Self {
        Self(buf)
    }
    /// Make a new [`AAString`] from a vector of any bytes.
    pub fn from_bytes(buf: Vec<u8>) -> Result<Self, NotAAStrError<A>> {
        let _: &aa_str<A> = aa_str::from_bytes(&buf)?;
        // SAFETY: just checked that the bytes are all `A`-bytes.
        unsafe { Ok(AAString::from_bytes_unchecked(buf)) }
    }
    /// Consume the [`AAString`] and return a `Vec` of bytes.
    pub fn into_bytes(self) -> Vec<u8> {
        let mut buf = ManuallyDrop::new(self.0);
        let ptr = buf.as_mut_ptr().cast::<u8>();
        let len = buf.len();
        let cap = buf.capacity();
        // SAFETY: byte buffer points to something that exists and is well aligned
        unsafe { Vec::from_raw_parts(ptr, len, cap) }
    }
    /// Make a new [`AAString`] from a vector of bytes,
    /// without checking those bytes are `A`-bytes.
    ///
    /// Safety
    /// ------
    /// You must be sure that all bytes in `buf` are valid
    /// aminoacids.
    ///
    /// Violating this guarantee means that arbitrary bytes
    /// may be interpreted erroneously as bytes of type `A`.
    pub unsafe fn from_bytes_unchecked(buf: Vec<u8>) -> Self {
        let mut buf = ManuallyDrop::new(buf);
        let ptr = buf.as_mut_ptr().cast::<A>();
        let len = buf.len();
        let cap = buf.capacity();
        unsafe { Self(Vec::from_raw_parts(ptr, len, cap)) }
    }
}
impl<A> AsRef<Vec<A>> for AAString<A> {
    fn as_ref(&self) -> &Vec<A> {
        &self.0
    }
}
impl<A> AsMut<Vec<A>> for AAString<A> {
    fn as_mut(&mut self) -> &mut Vec<A> {
        &mut self.0
    }
}
impl<A: AALike> Deref for AAString<A> {
    type Target = aa_str<A>;
    fn deref(&self) -> &Self::Target {
        aa_str::new(&self.0)
    }
}

impl<A: AALike> Borrow<aa_str<A>> for AAString<A> {
    fn borrow(&self) -> &aa_str<A> {
        &*self
    }
}
impl<A: AALike> ToOwned for aa_str<A> {
    type Owned = AAString<A>;
    fn to_owned(&self) -> Self::Owned {
        AAString::new(self.as_slice().to_owned())
    }
    fn clone_into(&self, target: &mut Self::Owned) {
        target.0.clear();
        target.0.extend_from_slice(self.as_slice());
    }
}

impl<A: AALike> Serialize for AAString<A> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.as_str().serialize(serializer)
    }
}
/// Newtype utility struct to deserialize a string
/// and validate that it is an [`AAString`].
///
/// The reason `AAString` is not on its own
/// deserializable is because I want to emphasize to
/// developers that deserialization of a string to a
/// validated `A`-string should be lenient and configurable,
/// via [`crate::validators::AAStringValidator`].
///
/// For example, the [`AAString<Aminoacid>`] type would
/// not deserialize a lowercase sequence of aminoacids,
/// or would maybe throw an error on asterisk stop
/// codons. This should be configurable by the user
/// instead of locking the future library maintainer
/// into "aminoacid strings are capitalized and
/// contain only the twenty canonical aminoacids".
pub struct AAStringStrict<A>(AAString<A>);
impl<A> From<AAString<A>> for AAStringStrict<A> {
    fn from(value: AAString<A>) -> Self {
        Self(value)
    }
}
impl<A> From<AAStringStrict<A>> for AAString<A> {
    fn from(value: AAStringStrict<A>) -> Self {
        value.0
    }
}
impl<A> Deref for AAStringStrict<A> {
    type Target = AAString<A>;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
impl<A> DerefMut for AAStringStrict<A> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}
impl<'de, A: AALike> Deserialize<'de> for AAStringStrict<A> {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        AAString::from_bytes(s.into_bytes())
            .map(Self)
            .map_err(serde::de::Error::custom)
    }
}
impl<A: AALike> Serialize for AAStringStrict<A> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.0.serialize(serializer)
    }
}
