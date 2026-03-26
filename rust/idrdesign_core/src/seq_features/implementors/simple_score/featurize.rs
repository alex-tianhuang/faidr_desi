use crate::{
    datatypes::AAMap,
    seq_features::{
        contexts::common::ResidueCounts, functionality::featurize::FeaturizableSeqFeats,
        implementors::simple_score::SimpleScore,
    },
};
use std::{
    convert::{Infallible, identity},
    iter::repeat_with,
};

impl FeaturizableSeqFeats for SimpleScore {
    type Ctx<'a> = &'a ResidueCounts;
    type Err = Infallible;
    /// Part of the [`FeaturizableSeqFeats`] template.
    ///
    /// Computes a weighted sum over the counts of each residue type.
    fn featurize<'a>(
        &self,
        sequence: &crate::datatypes::aa_canonical_str,
        ctx: Self::Ctx<'a>,
    ) -> impl Iterator<Item = Result<f32, Self::Err>> {
        let SimpleScore { sums, averages } = self;
        let mut sums = sums.iter();
        let mut averages = averages.iter();
        repeat_with(move || {
            sums.next()
                .map(|s| compute_simple_score(s, &ctx))
                .or_else(|| {
                    averages
                        .next()
                        .map(|s| compute_simple_score(s, &ctx) / sequence.len() as f32)
                })
                .map(Result::Ok)
        })
        .map_while(identity)
    }
}
/// Helper for [`SimpleScore::featurize`].
///
/// Compute a weighted sum over counts of each residue type.
fn compute_simple_score(s: &AAMap<f32>, counts: &ResidueCounts) -> f32 {
    counts
        .values()
        .zip(s.values())
        .map(|(&count, &weight)| count as f32 * weight)
        .sum::<f32>()
}
