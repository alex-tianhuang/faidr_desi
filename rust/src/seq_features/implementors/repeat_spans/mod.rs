use crate::{datatypes::AASet, seq_features::functionality::featdim::FeatDim};
pub(crate) mod compile;
mod featurize;
/// Container for computing
/// "repeat-span" of certain residue groups.
/// 
/// For example, the repeat-span of `G` in a sequence
/// would be the number of `G`s immediately followed by another `G`.
pub struct RepeatSpans {
    repeats: Vec<RepeatSpan>
}
/// Compute a single "repeat-span".
/// 
/// For example, the repeat-span of `G` in a sequence
/// would be the number of `G`s immediately followed by another `G`.
/// 
/// You can divide by sequence length if desired.
#[derive(PartialEq)]
pub struct RepeatSpan {
    res_group: AASet,
    take_average: bool
}
impl FeatDim for RepeatSpans {
    /// Number of repeat features being computed.
    fn featdim(&self) -> usize {
        self.repeats.len()
    }
}