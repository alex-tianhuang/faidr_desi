use regex::Regex;

use crate::seq_features::functionality::featdim::FeatDim;
pub(crate) mod compile;
mod featurize;
mod render;
/// Container of regexes to do motif-related operations.
///
/// Currently supports:
/// 1. Count the number of occurrences of a motif
/// 2. Count the number of residues spanned by a motif
/// 3. Divide either of the above by sequence length
pub struct RegexMotifs {
    /// Patterns on which to count the number of occurrences
    counts: Vec<Regex>,
    /// Same as [`RegexMotifs::counts`] but divide by sequence length
    count_averages: Vec<Regex>,
    /// Patterns on which to count the number of residues spanned
    spans: Vec<Regex>,
    /// Same as [`RegexMotifs::spans`] but divide by sequence length
    span_averages: Vec<Regex>,
}
impl FeatDim for RegexMotifs {
    fn featdim(&self) -> usize {
        self.counts.len() + self.count_averages.len() + self.spans.len() + self.span_averages.len()
    }
}
