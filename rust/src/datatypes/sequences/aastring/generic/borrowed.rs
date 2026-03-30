//! Module defining a generic borrowed aminoacid string, [`aa_str`].
use crate::datatypes::sequences::aastring::generic::AALike;
use serde::Serialize;
use std::{
    marker::PhantomData,
    ops::{Index, Range, RangeFrom, RangeTo},
};
use thiserror::Error;
/// Borrowed string datatype generic over [`AALike`] datatypes,
/// which I refer to in the docs using the generic type `A`.
///
/// It's essentially just a slice of a subset of bytes
/// that can also be interpreted as a `str` sometimes.
#[allow(non_camel_case_types)]
pub struct aa_str<A>([A]);
impl<A: AALike> aa_str<A> {
    /// Cast a slice of `A`s as this type.
    pub fn new(slice: &[A]) -> &Self {
        let ptr = slice as *const [A] as *const Self;
        unsafe { &*ptr }
    }
    /// Cast this type as a [`str`] ref.
    pub fn as_str(&self) -> &str {
        let ptr = &self.0 as *const [A] as *const str;
        // SAFETY: If you read the contract for implementing `AALike`,
        //         this is one of the conditions for doing so.
        //         Assuming `AALike` is safely implemented,
        //         this function is safe to use.
        unsafe { &*ptr }
    }
    /// Try and convert the slice of bytes to an [`aa_str`].
    ///
    /// Fails if any of the bytes in the slice are non-[`Aminoacid`]s.
    pub fn from_bytes(slice: &[u8]) -> Result<&Self, NotAAStrError<A>> {
        for (at, &ch) in slice.iter().enumerate() {
            A::try_from(ch as char).map_err(|_| NotAAStrError {
                at,
                ch: ch as char,
                __phantom: PhantomData,
            })?;
        }
        Ok(unsafe { aa_str::from_bytes_unchecked(slice) })
    }
    /// Parse an [`aa_str`] from the given slice of bytes,
    /// which may represent a sequence over multiple lines.
    ///
    /// Parsing will remove whitespace but will fail on
    /// other unexpected characters (such as non-`A` bytes
    /// or lowercase characters).
    pub fn join_multiline(slice: &mut [u8]) -> Result<&Self, NotAAStrError<A>> {
        let mut non_aa_start_idx = None;
        for i in 0..slice.len() {
            let c = slice[i] as char;
            if A::try_from(c).is_ok() {
                continue;
            }
            if !c.is_ascii_whitespace() {
                return Err(NotAAStrError::new(i, c))
            }
            non_aa_start_idx = Some(i);
            break;
        }
        let Some(start) = non_aa_start_idx else {
            // SAFETY: `non_aa_start_idx` is `None` if and only if
            //         all characters pass `A::try_from` above.
            return Ok(unsafe {Self::from_bytes_unchecked(slice) })
        };
        let mut len = start;
        let mut chunk_start = start + 1;
        for i in chunk_start..slice.len() {
            let c = slice[i] as char;
            if A::try_from(c).is_ok() {
                continue;
            };
            if !c.is_ascii_whitespace() {
                return Err(NotAAStrError::new(i, c))
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
        // SAFETY: The loop invariant is that `len` bytes
        //         are always valid `A`-bytes.
        return Ok(unsafe {Self::from_bytes_unchecked(&slice[..len]) }) 
    }
}
impl<A> aa_str<A> {
    /// Cast this type as a slice.
    pub fn as_slice(&self) -> &[A] {
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
    /// in `slice` are valid instances of `A`, the inner type in the buffer.
    ///
    /// Failing to uphold this guarantee has the same consequences
    /// as casting a non-`A` byte to this `A` type.
    pub(crate) unsafe fn from_bytes_unchecked(slice: &[u8]) -> &Self {
        let ptr = slice as *const [u8] as *const Self;
        unsafe { &*ptr }
    }
}
impl<A> Index<usize> for aa_str<A> {
    type Output = A;
    fn index(&self, index: usize) -> &Self::Output {
        self.0.index(index)
    }
}
/// Shorthand for implementing index for `aa_str`
/// by wrapping a subslice with `aa_str`.
macro_rules! derive_index_impl {
    ($($index_type:ty),+) => {
        $(impl<A: AALike> Index<$index_type> for aa_str<A> {
            type Output = aa_str<A>;
            fn index(&self, index: $index_type) -> &Self::Output {
                aa_str::new(self.0.index(index))
            }
        })+
    };
}
derive_index_impl!(Range<usize>, RangeFrom<usize>, RangeTo<usize>);
impl<'a, A: AALike> IntoIterator for &'a aa_str<A> {
    type Item = A;
    type IntoIter = std::iter::Copied<std::slice::Iter<'a, A>>;
    fn into_iter(self) -> Self::IntoIter {
        self.0.iter().copied()
    }
}

impl<A: AALike> Serialize for aa_str<A> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.as_str().serialize(serializer)
    }
}
/// Error returned when converting bytes to an [`aa_str`].
#[derive(Debug, Error)]
#[error("expected string of {}s, but found `{ch}` at index {at}", A::DESCRIBE)]
pub struct NotAAStrError<A: AALike> {
    /// Index at which an invalid character was found.
    pub at: usize,
    /// Character that is not an aminoacid.
    pub ch: char,
    /// Type used to vary the error message string.
    __phantom: PhantomData<A>,
}
impl<A: AALike> NotAAStrError<A> {
    /// Constructor.
    pub fn new(at: usize, ch: char) -> Self {
        Self { at, ch, __phantom: PhantomData }
    }
    /// Increase the position of this error by `offset`.
    ///
    /// Useful when translating an error from a subslice of bytes.
    pub fn offset(self, offset: usize) -> Self {
        Self {
            at: self.at + offset,
            ch: self.ch,
            __phantom: PhantomData,
        }
    }
}
