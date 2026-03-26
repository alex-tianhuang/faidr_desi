//! Module for sequence validation.
//!
//! See [`AAStringValidationParameters`].
use serde::Deserialize;
use std::borrow::Cow;
use tsify::Tsify;
mod parser;
use crate::datatypes::sequences::generic::{AALike, NotAAStrError, aa_str};
pub(crate) use parser::AAStringParser;
pub use parser::{AAStringParsingParameters, CapitalizeMode, OmitMode};
use thiserror::Error;

/// Sequence validator type.
///
/// 1. Checks/ensures that all characters are valid, capitalized
///    aminoacids.
/// 2. Checks that the length is not too small.
///
/// May modify the sequence being validated, see [`AAStringParser`].
pub(crate) struct AAStringValidator<A> {
    /// For parsing the aminoacid string without requiring any length
    /// (even empty sequences).
    parser: AAStringParser<A>,
    /// The minimum number of aminoacids constituting a sequence.
    min_sequence_length: usize,
}
/// Marshallable settings object describing how to validate an
/// arbitrary string to an aminoacid string with reasonable properties.
///
/// See also [`AAStringParsingParameters`] and [`AAStringValidator`].
#[derive(Tsify, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AAStringValidationParameters {
    /// Parser that may modify unexpected characters.
    #[serde(flatten)]
    parsing_params: AAStringParsingParameters,
    /// The minimum number of aminoacids constituting a sequence.
    min_sequence_length: usize,
}
/// Error returned when a sequence cannot be parsed.
#[derive(Debug, Error)]
pub enum SequenceValidationError<A: AALike> {
    /// An invalid character was found in the sequence.
    #[error("{reason}")]
    InvalidCharacter { reason: NotAAStrError<A> },
    /// The sequence was too short
    /// (possibly only after removing invalid characters).
    #[error("{prefix}sequence was {actual_length} characters long, but needs to be at least {expected_length} long", prefix = if *trimmed {"after removing invalid characters, "} else {""})]
    TooShort {
        trimmed: bool,
        actual_length: usize,
        expected_length: usize,
    },
}

impl<A: AALike> AAStringValidator<A> {
    /// Make a new validator from the given parameters.
    pub fn new(params: AAStringValidationParameters) -> Self {
        let AAStringValidationParameters {
            parsing_params,
            min_sequence_length,
        } = params;
        Self {
            parser: AAStringParser::new(parsing_params),
            min_sequence_length,
        }
    }
    /// Same as [`AAStringParser::parse_cow`] but with a minimum length check.
    ///
    /// Invariant
    /// ---------
    /// If this method returns [`Cow::Borrowed`] on a slice from
    /// an owned vector, it is safe to assume that the vector
    /// can be cast using [`AAString::from_bytes_unchecked`].
    ///
    /// This property is a consequence of [`AAStringParser::parse_cow`]
    /// upholding the same invariant.
    ///
    /// [`AAString::from_bytes_unchecked`]: crate::datatypes::sequences::generic::AAString::from_bytes_unchecked
    pub fn validate_cow<'a>(
        &self,
        slice: &'a [u8],
    ) -> Result<Cow<'a, aa_str<A>>, SequenceValidationError<A>> {
        let sequence = self
            .parser
            .parse_cow(slice)
            .map_err(|reason| SequenceValidationError::InvalidCharacter { reason })?;
        self.check_length(sequence.len(), slice.len())?;
        Ok(sequence)
    }
    /// Ensure that the length of the parsed sequence is not too short.
    fn check_length<'a>(
        &self,
        parsed_len: usize,
        original_len: usize,
    ) -> Result<(), SequenceValidationError<A>> {
        if parsed_len < self.min_sequence_length {
            Err(SequenceValidationError::TooShort {
                trimmed: parsed_len < original_len,
                actual_length: parsed_len,
                expected_length: self.min_sequence_length,
            })
        } else {
            Ok(())
        }
    }
}
