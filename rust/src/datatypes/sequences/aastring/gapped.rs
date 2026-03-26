//! Some type aliases for aminoacid/gap character strings.
use crate::datatypes::{
    AACanonicalString, Aminoacid, aa_canonical_str,
    sequences::{
        aastring::generic::{AAString, NotAAStrError, aa_str},
        aminoacid::AminoacidGapped,
        generic::{AALike, AAStringStrict},
    },
};
/// Borrowed `str` analogue for [`AminoacidGapped`] strings.
#[allow(non_camel_case_types)]
pub type aa_gapped_str = aa_str<AminoacidGapped>;
/// Owned `String` analogue for [`AminoacidGapped`] strings.
pub type AAGappedString = AAString<AminoacidGapped>;
/// Strict deserialization wrapper for [`AAGappedString`].
#[allow(non_camel_case_types)]
pub type AAGappedStringStrict = AAStringStrict<Aminoacid>;
/// Error returned when converting bytes to an [`aa_gapped_str`].
pub type NotGappedAAStrError = NotAAStrError<AminoacidGapped>;

impl aa_gapped_str {
    /// Cast a `str` of canonical [`Aminoacid`]s as an [`aa_gapped_str`].
    fn from_canonical(s: &aa_canonical_str) -> &Self {
        let ptr = s.as_slice() as *const [Aminoacid] as *const [AminoacidGapped];
        // SAFETY: all `Aminoacid`s are also `AminoacidGapped`s.
        aa_gapped_str::new(unsafe { &*ptr })
    }
}
impl AAGappedString {
    /// Cast a `String` of canonical [`Aminoacid`]s as an [`AAGappedString`].
    fn from_canonical(s: AACanonicalString) -> Self {
        let buf = s.into_bytes();
        // SAFETY: all `Aminoacid`s are also `AminoacidGapped`s.
        unsafe { Self::from_bytes_unchecked(buf) }
    }
}
// SAFETY: a slice of `AminoacidGapped`s is a valid string slice.
unsafe impl AALike for AminoacidGapped {
    const DESCRIBE: &'static str = "single-letter aminoacid or gap character";
}
