use std::convert::Infallible;

use crate::seq_features::{
    contexts::common::ResidueCounts,
    functionality::featurize::FeaturizableSeqFeats,
    implementors::log_ratio::{LogRatio, LogRatioContainer},
};

impl FeaturizableSeqFeats for LogRatioContainer {
    type Ctx<'a> = &'a ResidueCounts;
    type Err = Infallible;
    /// Part of the [`FeaturizableSeqFeats`] template.
    ///
    /// See [`compute_soft_log_ratio`].
    fn featurize<'a>(
        &self,
        _sequence: &crate::datatypes::aa_canonical_str,
        ctx: Self::Ctx<'a>,
    ) -> impl Iterator<Item = Result<f64, Self::Err>> {
        self.data
            .iter()
            .map(|feature| Ok(compute_soft_log_ratio(feature, ctx)))
    }
}
/// Helper function for [`LogRatioContainer::featurize`].
///
/// Compute log1p ratio (natural log).
fn compute_soft_log_ratio(feature: &LogRatio, residue_counts: &ResidueCounts) -> f64 {
    let LogRatio {
        numerator,
        denominator,
    } = *feature;
    ((residue_counts[numerator] + 1) as f64 / (residue_counts[denominator] + 1) as f64).ln()
}
