use crate::{
    datatypes::AAMap,
    seq_features::{
        functionality::featdim::FeatDim,
    },
};
pub(crate) mod compile;
mod featurize;
mod render;
/// Container full of features that are weighted sums
/// over residue counts.
///
/// Supports optionally dividing by sequence length.
pub struct SimpleScore {
    sums: Vec<AAMap<f64>>,
    averages: Vec<AAMap<f64>>,
}
impl FeatDim for SimpleScore {
    fn featdim(&self) -> usize {
        self.sums.len() + self.averages.len()
    }
}
