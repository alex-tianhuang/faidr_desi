//! Module defining some generic "aminoacid string" datatypes,
//! which are just wrappers around slices that can be cast safely to strings.
mod borrowed;
mod owned;
pub use borrowed::aa_canonical_str;
pub use owned::{AACanonicalString, AACanonicalStringStrict};