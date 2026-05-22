//! Module defining a generic borrowed aminoacid string, [`aa_canonical_str`]
//! and [`NotAAStrError`].
use serde::Serialize;
use thiserror::Error;
use std::{
    ops::{Index, Range, RangeFrom, RangeTo},
};

use crate::datatypes::Aminoacid;
/// Borrowed string datatype generic over [`Aminoacid`]s.
///
/// It's essentially just a slice of a subset of bytes
/// that can also be interpreted as a `str` sometimes.
#[allow(non_camel_case_types)]
pub struct aa_canonical_str([Aminoacid]);
impl aa_canonical_str {
    /// Cast a slice of `Aminoacid`s as this type.
    pub fn new(slice: &[Aminoacid]) -> &Self {
        let ptr = slice as *const [Aminoacid] as *const Self;
        unsafe { &*ptr }
    }
    /// Cast this type as a [`str`] ref.
    pub fn as_str(&self) -> &str {
        let ptr = &self.0 as *const [Aminoacid] as *const str;
        unsafe { &*ptr }
    }
    /// Try and convert the slice of bytes to an [`aa_canonical_str`].
    ///
    /// Fails if any of the bytes in the slice are non-[`Aminoacid`]s.
    pub fn from_bytes(slice: &[u8]) -> Result<&Self, NotAAStrError> {
        for (at, &ch) in slice.iter().enumerate() {
            Aminoacid::try_from(ch as char).map_err(|_| NotAAStrError { at, ch: ch as char })?;
        }
        Ok(unsafe { Self::from_bytes_unchecked(slice) })
    }
    /// Parse an [`aa_canonical_str`] from the given slice of bytes,
    /// which may represent a sequence over multiple lines.
    ///
    /// Parsing will remove whitespace but will fail on
    /// other unexpected characters (such as non-aminoacid bytes
    /// or lowercase characters).
    pub fn join_multiline(slice: &mut [u8]) -> Result<&Self, NotAAStrError> {
        let mut non_aa_start_idx = None;
        for i in 0..slice.len() {
            let c = slice[i] as char;
            if Aminoacid::try_from(c).is_ok() {
                continue;
            }
            if !c.is_ascii_whitespace() {
                return Err(NotAAStrError {
                    ch: c,
                    at: i
                });
            }
            non_aa_start_idx = Some(i);
            break;
        }
        let Some(start) = non_aa_start_idx else {
            return Ok(unsafe { Self::from_bytes_unchecked(slice) });
        };
        let mut len = start;
        let mut chunk_start = start + 1;
        for i in chunk_start..slice.len() {
            let c = slice[i] as char;
            if Aminoacid::try_from(c).is_ok() {
                continue;
            };
            if !c.is_ascii_whitespace() {
                return Err(NotAAStrError {
                    ch: c,
                    at: i
                });
            }
            if chunk_start < i {
                let chunk_range = chunk_start..i;
                slice.copy_within(chunk_range.clone(), len);
                len += chunk_range.len();
            }
            chunk_start = i + 1;
        }
        if chunk_start < slice.len() {
            let chunk_range = chunk_start..slice.len();
            slice.copy_within(chunk_range.clone(), len);
            len += chunk_range.len();
        }
        return Ok(unsafe { Self::from_bytes_unchecked(&slice[..len]) });
    }
    /// Cast this type as a slice.
    pub fn as_slice(&self) -> &[Aminoacid] {
        &self.0
    }
    /// Returns the number of characters in the sequence.
    pub fn len(&self) -> usize {
        self.0.len()
    }
    /// Cast a slice of bytes as this type, without
    /// checking that the bytes are all valid instances
    /// of the underlying generic byte subset.
    ///
    /// Safety
    /// ------
    ///
    /// To use this function safely, check that all the bytes
    /// in `slice` are valid aminoacids, the inner type in the buffer.
    pub(crate) unsafe fn from_bytes_unchecked(slice: &[u8]) -> &Self {
        let ptr = slice as *const [u8] as *const Self;
        unsafe { &*ptr }
    }
}
impl Index<usize> for aa_canonical_str {
    type Output = Aminoacid;
    fn index(&self, index: usize) -> &Self::Output {
        self.0.index(index)
    }
}
/// Shorthand for implementing index for `aa_canonical_str`
/// by wrapping a subslice with `aa_canonical_str`.
macro_rules! derive_index_impl {
    ($($index_type:ty),+) => {
        $(impl Index<$index_type> for aa_canonical_str {
            type Output = aa_canonical_str;
            fn index(&self, index: $index_type) -> &Self::Output {
                aa_canonical_str::new(self.0.index(index))
            }
        })+
    };
}
derive_index_impl!(Range<usize>, RangeFrom<usize>, RangeTo<usize>);
impl<'a> IntoIterator for &'a aa_canonical_str {
    type Item = Aminoacid;
    type IntoIter = std::iter::Copied<std::slice::Iter<'a, Aminoacid>>;
    fn into_iter(self) -> Self::IntoIter {
        self.0.iter().copied()
    }
}

impl Serialize for aa_canonical_str {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.as_str().serialize(serializer)
    }
}
/// Error returned when a non-aminoacid is found
/// while attempting to parse an aminoacid string.
#[derive(Debug, Error)]
#[error("could not parse character {} at index {}", ch, at)]
pub struct NotAAStrError {
    pub ch: char,
    pub at: usize,
}