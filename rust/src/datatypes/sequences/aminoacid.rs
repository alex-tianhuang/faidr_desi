//! Module defining the [`Aminoacid`] enum.
use std::mem;
use thiserror::Error;
use tsify::Tsify;

/// Macro that defines the [`Aminoacid`] enum
/// and reduces some of the boilerplate.
macro_rules! define_aminoacids {
    ($($(#[$($variant_attrs:tt)*])* $variant:ident = $b:expr),+) => {
        /// Standard 20 aminoacids.
        ///
        /// The enum is defined so that casting it into a byte
        /// returns the capitalized single-letter aminoacid.
        #[derive(Tsify, Copy, Clone, Eq, PartialEq, Ord, PartialOrd, Hash)]
        #[tsify(from_wasm_abi)]
        #[repr(u8)]
        pub enum Aminoacid {
            $($(#[$($variant_attrs)*])* $variant = $b),+
        }
        impl TryFrom<char> for Aminoacid {
            type Error = NotAminoacidError;
            fn try_from(value: char) -> Result<Self, NotAminoacidError> {
                match value as u8 {
                    $($b => Ok(Self::$variant),)+
                    _ => Err(NotAminoacidError { ch: value })
                }
            }
        }
        /// All the aminoacids in one place, so that I can iterate over them.
        pub const AMINOACIDS: [Aminoacid; 20] = [$(Aminoacid::$variant),+];
        /// For each variant of [`Aminoacid`], the corresponding
        /// index (as `u8`) at which it appears in [`AMINOACIDS`].
        #[derive(Copy, Clone, Eq, PartialEq, Ord, PartialOrd, Hash)]
        #[repr(u8)]
        pub enum AAIndex {
            $($variant),+
        }
        impl Aminoacid {
            /// Convert this to an [`AAIndex`].
            pub const fn to_aaindex(self) -> AAIndex {
                match self {
                    $(Aminoacid::$variant => AAIndex::$variant),+
                }
            }
        }
    };
}
define_aminoacids! {
    /// Alanine (Ala)
    A = b'A',
    /// Cysteine (Cys)
    C = b'C',
    /// Aspartic acid / Aspartate (Asp)
    D = b'D',
    /// Glutamic acid / Glutamate (Glu)
    E = b'E',
    /// Phenylalanine (Phe)
    F = b'F',
    /// Glycine (Gly)
    G = b'G',
    /// Histidine (His)
    H = b'H',
    /// Isoleucine (Ile)
    I = b'I',
    /// Lysine (Lys)
    K = b'K',
    /// Leucine (Leu)
    L = b'L',
    /// Methionine (Met)
    M = b'M',
    /// Asparagine (Asn)
    N = b'N',
    /// Proline (Pro)
    P = b'P',
    /// Glutamine (Gln)
    Q = b'Q',
    /// Arginine (Arg)
    R = b'R',
    /// Serine (Ser)
    S = b'S',
    /// Threonine (Thr)
    T = b'T',
    /// Valine (Val)
    V = b'V',
    /// Tryptophan (Trp)
    W = b'W',
    /// Tyrosine (Tyr)
    Y = b'Y'
}
impl std::fmt::Debug for Aminoacid {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        std::fmt::Debug::fmt(&(u8::from(*self) as char), f)
    }
}
impl std::fmt::Display for Aminoacid {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        std::fmt::Display::fmt(&(u8::from(*self) as char), f)
    }
}
impl<'de> serde::Deserialize<'de> for Aminoacid {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let ch = <char as serde::Deserialize>::deserialize(deserializer)?;
        Aminoacid::try_from(ch).map_err(serde::de::Error::custom)
    }
}
impl serde::Serialize for Aminoacid {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        <char as serde::Serialize>::serialize(&(u8::from(*self) as char), serializer)
    }
}
impl From<Aminoacid> for u8 {
    fn from(value: Aminoacid) -> Self {
        value as u8
    }
}
/// Error returned when converting a byte to an [`Aminoacid`].
#[derive(Debug, Error)]
#[error("expected single-letter aminoacid, got `{ch}`")]
pub struct NotAminoacidError {
    /// Character that is not an aminoacid.
    pub ch: char,
}

impl AAIndex {
    /// Lowest index (0).
    pub const MIN: Self = AAIndex::A;
    /// Highest index (19).
    pub const MAX: Self = AAIndex::Y;
    /// Convert this to an [`Aminoacid`].
    pub fn to_aminoacid(self) -> Aminoacid {
        AMINOACIDS[self as u8 as usize]
    }
    /// Get the "next" [`AAIndex`] that is 1 above the current one.
    pub fn step(self) -> Option<AAIndex> {
        if self == AAIndex::MAX {
            return None;
        }
        // SAFETY: for anything below 19,
        // adding one also gets to a number
        // less than or equal to 19.
        Some(unsafe { mem::transmute::<u8, AAIndex>(self as u8 + 1) })
    }
}
