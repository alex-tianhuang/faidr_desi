use crate::{datatypes::Aminoacid, seq_features::functionality::featdim::FeatDim};
pub(crate) mod compile;
mod featurize;
mod render;
/// Single log ratio feature.
///
/// Computes a soft log ratio of two different aminoacids.
#[derive(PartialEq, Eq, PartialOrd, Ord)]
pub struct LogRatio {
    numerator: Aminoacid,
    denominator: Aminoacid,
}
/// Container of log ratio features.
pub struct LogRatioContainer {
    data: Vec<LogRatio>,
}
impl FeatDim for LogRatioContainer {
    fn featdim(&self) -> usize {
        self.data.len()
    }
}
