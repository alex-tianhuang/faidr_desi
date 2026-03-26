use std::convert::Infallible;

use crate::{
    datatypes::aa_canonical_str,
    seq_features::{
        contexts::common::ResidueCounts, functionality::featurize::FeaturizableSeqFeats,
        implementors::sequence_complexity::SequenceComplexity,
    },
};

impl FeaturizableSeqFeats for SequenceComplexity {
    type Ctx<'a> = &'a ResidueCounts;
    type Err = Infallible;
    /// Part of the [`FeaturizableSeqFeats`] template.
    ///
    /// Computes a measure of sequence complexity, is
    /// a wrapper around [`compute_sequence_complexity`].
    fn featurize<'a>(
            &self,
            sequence: &aa_canonical_str,
            ctx: Self::Ctx<'a>,
        ) -> impl Iterator<Item = Result<f32, Self::Err>> {
        self.enabled
            .then(|| Ok(compute_sequence_complexity(sequence, ctx)))
            .into_iter()
    }
}
/// Function doing the work for [`SequenceComplexity::featurize`].
///
/// Computes a natural log base measure of sequence complexity.
fn compute_sequence_complexity(sequence: &aa_canonical_str, counts: &ResidueCounts) -> f32 {
    let sum_ln_gamma = counts
        .0
        .into_iter()
        .map(|count| (special::Gamma::ln_gamma((1 + count) as f32)).0)
        .sum::<f32>();
    let ln_sum_gamma = special::Gamma::ln_gamma((1 + sequence.len()) as f32).0;
    (ln_sum_gamma - sum_ln_gamma) / (sequence.len() as f32)
}
