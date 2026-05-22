//! Module full of sequence/aminoacid-related datatypes.
mod aamap;
mod aaset;
mod aastring;
mod aminoacid;
pub use aamap::{AAMap, JSFacingAAMap};
pub use aaset::AASet;
pub(crate) use aastring::{
    AACanonicalString, aa_canonical_str,
};
pub(crate) use aminoacid::{AAIndex, AMINOACIDS, Aminoacid};
