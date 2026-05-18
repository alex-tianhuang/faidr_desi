mod aamap;
mod aaset;
mod aastring;
mod aminoacid;
pub use aamap::{AAMap, JSFacingAAMap};
pub use aaset::AASet;
pub(crate) use aastring::{
    AACanonicalString, AACanonicalStringStrict, aa_canonical_str,
    generic,
};
pub(crate) use aminoacid::{AAIndex, AMINOACIDS, Aminoacid, NotAminoacidError};
