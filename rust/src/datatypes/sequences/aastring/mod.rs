//! Module defining aminoacid string datatypes.
//!
//! Since the definition of "valid aminoacid character"
//! can vary depending on whether gaps or non-canonical
//! aminoacids are allowed, the most general implementation
//! are in the [`generic`] module.
//!
//! Otherwise, check out the default [`Aminoacid`] strings
//! [`aa_canonical_str`] and [`AACanonicalString`],
//! or the aminoacid + gap types in the [`gapped`] module.
pub(crate) mod gapped;
pub(crate) mod generic;
use crate::datatypes::Aminoacid;
use generic::AALike;

/// Borrowed `str` analogue for [`Aminoacid`] strings.
#[allow(non_camel_case_types)]
pub type aa_canonical_str = generic::aa_str<Aminoacid>;
/// Owned `String` analogue for [`Aminoacid`] strings.
#[allow(non_camel_case_types)]
pub type AACanonicalString = generic::AAString<Aminoacid>;
/// Strict deserialization wrapper for [`AACanonicalString`].
#[allow(non_camel_case_types)]
pub type AACanonicalStringStrict = generic::AAStringStrict<Aminoacid>;
/// Error returned when converting bytes to an [`aa_canonical_str`].
#[allow(non_camel_case_types)]
pub type NotCanonicalAAStrError = generic::NotAAStrError<Aminoacid>;
// SAFETY: a slice of `Aminoacid`s is a valid string slice.
unsafe impl AALike for Aminoacid {
    const DESCRIBE: &'static str = "single-letter aminoacid character";
}
