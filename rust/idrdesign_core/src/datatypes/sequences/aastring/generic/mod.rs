//! Module defining some generic "aminoacid string" datatypes,
//! which are just wrappers around slices that can be cast safely to strings.
//! 
//! See [`aa_str`] and [`AAString`].
use std::fmt::Debug;
mod borrowed;
mod owned;
pub use borrowed::{NotAAStrError, aa_str};
pub use owned::{AAString, AAStringStrict};
/// A one-byte datatype that is representable by a subset
/// (single-byte, not arbitrary chars) of displayable characters.
///
/// Safety
/// ------
/// Only implement this trait if you are sure a slice of these bytes
/// can be safely cast as a string slice of single byte characters.
pub unsafe trait AALike: Sized + Debug + Copy + TryFrom<char> + Into<u8> {
    /// A lowercase string describing what bytes of this type represent.
    ///
    /// Make sure it reads well in the sentence:
    /// `expected string of {DESCRIBE}s`
    const DESCRIBE: &'static str;
}