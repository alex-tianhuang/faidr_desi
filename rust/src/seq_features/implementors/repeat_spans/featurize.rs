use std::convert::Infallible;

use crate::{
    datatypes::aa_canonical_str,
    seq_features::{
        functionality::featurize::FeaturizableSeqFeats,
        implementors::repeat_spans::{RepeatSpan, RepeatSpans},
    },
};

impl FeaturizableSeqFeats for RepeatSpans {
    type Ctx<'a> = ();
    type Err = Infallible;
    /// Run [`compute_repeat_span`] on all repeats in this container.
    fn featurize<'a>(
        &self,
        sequence: &crate::datatypes::aa_canonical_str,
        _ctx: Self::Ctx<'a>,
    ) -> impl Iterator<Item = Result<f64, Self::Err>> {
        self.repeats
            .iter()
            .map(|feature| Ok(compute_repeat_span(sequence, feature)))
    }
}
/// Compute the number of residues spanned by repeats of residues in a given group.
fn compute_repeat_span(sequence: &aa_canonical_str, feature: &RepeatSpan) -> f64 {
    let RepeatSpan {
        ref res_group,
        take_average,
    } = *feature;
    let mut total = 0;
    let mut segment_start = None;
    for (i, aa) in sequence.into_iter().enumerate() {
        if res_group.contains(aa) {
            if segment_start.is_none() {
                segment_start = Some(i)
            }
        } else {
            if let Some(start) = segment_start.take() {
                total += i - 1 + start
            }
        }
    }
    if let Some(start) = segment_start.take() {
        total += sequence.len() - 1 + start
    }
    if take_average {
        total as f64 / sequence.len() as f64
    } else {
        total as f64
    }
}
