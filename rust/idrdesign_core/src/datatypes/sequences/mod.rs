mod aamap;
mod aaset;
mod aastring;
mod aminoacid;
pub(crate) use aamap::const_aamap;
pub use aamap::{AAMap, AAWeights, JSFacingAAMap};
pub use aaset::AASet;
pub(crate) use aastring::{
    AACanonicalString, AACanonicalStringStrict, NotCanonicalAAStrError, aa_canonical_str, gapped,
    generic,
};
pub(crate) use aminoacid::{AAIndex, AMINOACIDS, Aminoacid, NotAminoacidError};
