//! Module defining aminoacid string datatypes.
//!
//! It's a bit more convoluted than you might expect
//! because the definition of "valid aminoacid character"
//! could vary depending on whether gaps or non-canonical
//! aminoacids are allowed. However I did not use this abstraction
//! in this project.
//! 
//! So the most general implementations of string/byte types
//! are in the [`generic`] module, but I only end up using
//! [`Aminoacid`] strings [`aa_canonical_str`] and [`AACanonicalString`].
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
// SAFETY: a slice of `Aminoacid`s is a valid string slice.
unsafe impl AALike for Aminoacid {
    const DESCRIBE: &'static str = "single-letter aminoacid character";
}
