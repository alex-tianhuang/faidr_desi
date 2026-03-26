//! Module defining [`AAStringParsingParameters`].
use crate::datatypes::{
    NotAminoacidError,
    sequences::generic::{AALike, AAString, NotAAStrError, aa_str},
};
use serde::Deserialize;
use std::{borrow::Cow, marker::PhantomData};
use tsify::Tsify;

/// A parser for aminoacid strings that is flexible
/// in how it handles unexpected characters.
pub(crate) struct AAStringParser<A> {
    params: AAStringParsingParameters,
    __phantom: PhantomData<fn(A)>,
}
/// Marshallable settings object for how to parse aminoacid strings
/// that may contain non-aminoacid characters.
#[derive(Tsify, Deserialize, Copy, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AAStringParsingParameters {
    /// Whether or not to capitalize lowercase characters.
    capitalize_mode: CapitalizeMode,
    /// Whether or not to omit unexpected characters.
    omit_mode: OmitMode,
}
/// Whether or not to capitalize lowercase characters.
#[derive(Tsify, Deserialize, Copy, Clone)]
#[serde(rename_all = "kebab-case")]
pub enum CapitalizeMode {
    /// A lowercase character is unexpected.
    Strict,
    /// Lowercase characters are capitalized.
    Capitalize,
}

/// Whether or not to omit unexpected characters.
#[derive(Tsify, Deserialize, Copy, Clone)]
#[serde(rename_all = "kebab-case")]
pub enum OmitMode {
    /// Throw an error on unexpected characters.
    Strict,
    /// Omit the unexpected characters.
    Omit,
}

impl<A: AALike> AAStringParser<A> {
    /// Make a new parser from the given parameters.
    pub fn new(params: AAStringParsingParameters) -> Self {
        Self { params, __phantom: PhantomData }
    }
    /// Try to parse a slice of bytes into a [`aa_str`],
    /// falling back on an owned [`AAString`] if characters
    /// are omitted / capitalized.
    ///
    /// Return a [`NotAAStrError`] if unable to do so.
    ///
    /// Invariant
    /// ---------
    /// If this method returns [`Cow::Borrowed`] on a slice from
    /// an owned vector, it is safe to assume that the vector
    /// can be cast using [`AAString::from_bytes_unchecked`].
    pub fn parse_cow<'a>(&self, slice: &'a [u8]) -> Result<Cow<'a, aa_str<A>>, NotAAStrError<A>> {
        let NotAAStrError { at, ch, .. } = match aa_str::from_bytes(slice) {
            // SAFETY comment in docs means this is the only place where this
            // function is allowed to return [`Cow::Borrowed`]
            Ok(s) => return Ok(Cow::Borrowed(s)),
            Err(error) => error,
        };

        let Ok(next_aa) = self.parse_byte(ch as u8) else {
            return Err(NotAAStrError::new(at, ch));
        };
        let mut buf = Vec::with_capacity(slice.len());
        // SAFETY: just checked these characters up to `at` are Aminoacids
        // (because of call to `<&aa_str>::from_bytes`).
        let starting_fragment = unsafe { aa_str::from_bytes_unchecked(&slice[..at]) };
        buf.extend_from_slice(starting_fragment.as_slice());
        buf.extend(next_aa);
        self.extend_into(&slice[at + 1..], &mut buf)
            .map_err(|error| error.offset(at + 1))?;
        Ok(Cow::Owned(AAString::new(buf)))
    }
    /// Convert the byte to the aminoacid-like byte (of type `A`).
    ///
    /// Return variants mean:
    /// ```
    /// match parser.parse_byte(b) {
    ///     Ok(Some(aa)) => /* the conversion was successful */,
    ///     Ok(None) => /* the character was omitted */,
    ///     Err(e) => /* the character could not be omitted or converted */
    /// }
    /// ```
    fn parse_byte(&self, b: u8) -> Result<Option<A>, NotAminoacidError> {
        let error = match A::try_from(b as char) {
            Ok(aa) => return Ok(Some(aa)),
            Err(_) => NotAminoacidError { ch: b as char },
        };
        if matches!(self.params.capitalize_mode, CapitalizeMode::Capitalize) {
            if let Ok(aa) = A::try_from(b.to_ascii_uppercase() as char) {
                return Ok(Some(aa));
            }
        }
        if matches!(self.params.omit_mode, OmitMode::Omit) {
            Ok(None)
        } else {
            Err(error)
        }
    }
    /// Extend an existing vector with more aminoacid-like bytes (of type `A`),
    /// converted from a slice of bytes.
    ///
    /// The existing vector is not reverted to its original
    /// state on a failure.
    fn extend_into(&self, slice: &[u8], target: &mut Vec<A>) -> Result<(), NotAAStrError<A>> {
        for (at, &b) in slice.iter().enumerate() {
            let aa = self
                .parse_byte(b)
                .map_err(|reason| NotAAStrError::new(at, reason.ch))?;
            target.extend(aa);
        }
        Ok(())
    }
}
