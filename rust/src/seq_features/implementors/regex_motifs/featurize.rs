use regex::Regex;
use std::{
    convert::{Infallible, identity},
    iter::repeat_with,
};

use crate::{
    datatypes::aa_canonical_str,
    seq_features::{
        functionality::featurize::FeaturizableSeqFeats, implementors::regex_motifs::RegexMotifs,
    },
};

impl FeaturizableSeqFeats for RegexMotifs {
    type Ctx<'a> = ();
    type Err = Infallible;
    /// Part of the [`FeaturizableSeqFeats`] template.
    ///
    /// Compute all operations related to regex-based motifs.
    ///
    /// Again, functionality here includes:
    /// 1. Counting the number of occurrences
    /// 2. Counting the number of residues spanned
    /// 3. Dividing by sequence length
    fn featurize<'a>(
        &self,
        sequence: &aa_canonical_str,
        _ctx: Self::Ctx<'a>,
    ) -> impl Iterator<Item = Result<f64, Self::Err>> {
        let RegexMotifs {
            counts,
            count_averages,
            spans,
            span_averages,
        } = self;
        let mut counts = counts.iter();
        let mut count_averages = count_averages.iter();
        let mut spans = spans.iter();
        let mut span_averages = span_averages.iter();
        repeat_with(move || {
            counts
                .next()
                .map(|pattern| count_motif(pattern, sequence))
                .or_else(|| {
                    count_averages
                        .next()
                        .map(|pattern| count_motif(pattern, sequence) / sequence.len() as f64)
                })
                .or_else(|| spans.next().map(|pattern| span_of_motif(pattern, sequence)))
                .or_else(|| {
                    span_averages
                        .next()
                        .map(|pattern| span_of_motif(pattern, sequence) / sequence.len() as f64)
                })
                .map(Result::Ok)
        })
        .map_while(identity)
    }
}
/// Utility method for [`RegexMotifs::featurize`].
///
/// Count the number of occurrences of the pattern in
/// the sequence.
fn count_motif(pattern: &Regex, sequence: &aa_canonical_str) -> f64 {
    pattern.find_iter(sequence.as_str()).count() as f64
}

/// Utility method for [`RegexMotifs::featurize`].
///
/// Count the number of residues spanned by the motif
/// in the sequence.
fn span_of_motif(pattern: &Regex, sequence: &aa_canonical_str) -> f64 {
    pattern
        .find_iter(sequence.as_str())
        .map(|m| m.len())
        .sum::<usize>() as f64
}
