//! Module defining the [`FeaturizableSeqFeats`] requirement.

use crate::datatypes::aa_canonical_str;

/// This trait specifies the requirement that a sequence feature
/// is able to output a vector of numbers (falliably per slot)
/// and may require additional context to make computation faster.
pub(crate) trait FeaturizableSeqFeats: Sized {
    /// Additional context about the sequence required to
    /// make the feature calculation faster.
    ///
    /// Context can refer to data with an extremely short lifetime,
    /// typically a temporary mutable ref.
    type Ctx<'a>;
    /// Error that may be returned in a falliable computation.
    type Err;
    /// Run the computation on `sequence`, returning as
    /// many values as necessary.
    fn featurize<'a>(
        &self,
        sequence: &aa_canonical_str,
        ctx: Self::Ctx<'a>,
    ) -> impl Iterator<Item = Result<f64, Self::Err>>;
}
