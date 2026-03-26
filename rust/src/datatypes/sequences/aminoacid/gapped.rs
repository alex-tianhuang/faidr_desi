//! Module for defining [`AminoacidGapped`].
//! Used for analyzing aligned sequences.
use crate::datatypes::{Aminoacid, sequences::aminoacid::derive_aa_as_char_impls};
use std::mem;
use thiserror::Error;

/// Byte representing a gap in most sequence alignment softwares.
const GAP_CHARACTER: u8 = b'-';
/// 20 standard aminoacids or a gap character.
///
/// It is a type guarantee that transmuting this datatype
/// to a byte will result in a valid [`Aminoacid`] or a dash
/// (which represents a gap in most sequence alignment softwares).
#[derive(Copy, Clone)]
pub struct AminoacidGapped(u8);
impl AminoacidGapped {
    /// If this byte is not a gap, return it as an [`Aminoacid`].
    pub fn to_aa(self) -> Option<Aminoacid> {
        if self.0 == GAP_CHARACTER {
            None
        } else {
            // SAFETY: The type guarantee of `AminoacidGapped`
            //         is that if it is not a gap it will be a
            //         valid `Aminoacid`.
            let aa = unsafe { mem::transmute(self) };
            Some(aa)
        }
    }
}
/// Error returned when converting a byte to an [`AminoacidGapped`].
#[derive(Debug, Error)]
#[error("expected single-letter aminoacid, got `{ch}`")]
pub struct NotAminoacidOrGapError {
    /// Character that is not an aminoacid or gap.
    pub ch: char,
}

impl TryFrom<char> for AminoacidGapped {
    type Error = NotAminoacidOrGapError;
    fn try_from(value: char) -> Result<Self, Self::Error> {
        let b = value as u8;
        if b == GAP_CHARACTER {
            return Ok(Self(b));
        }
        if Aminoacid::try_from(value).is_ok() {
            return Ok(Self(b));
        }
        Err(NotAminoacidOrGapError { ch: value })
    }
}
impl From<AminoacidGapped> for u8 {
    fn from(value: AminoacidGapped) -> Self {
        value.0
    }
}
derive_aa_as_char_impls!(AminoacidGapped);
