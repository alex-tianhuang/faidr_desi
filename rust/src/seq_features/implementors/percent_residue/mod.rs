use crate::{datatypes::AASet, seq_features::functionality::featdim::FeatDim};
pub(crate) mod compile;
mod featurize;

/// A sequence feature collection representing the
/// composition (% of some aminoacids) of the sequence.
pub struct PercentResidue {
    residues: AASet,
}
impl FeatDim for PercentResidue {
    fn featdim(&self) -> usize {
        self.residues.len() as usize
    }
}
