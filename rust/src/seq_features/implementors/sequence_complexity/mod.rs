use crate::seq_features::{
    functionality::featdim::FeatDim,
};

mod compile;
mod featurize;

/// A single feature for computing global sequence complexity.
pub struct SequenceComplexity {
    enabled: bool,
}
impl FeatDim for SequenceComplexity {
    fn featdim(&self) -> usize {
        self.enabled as usize
    }
}
