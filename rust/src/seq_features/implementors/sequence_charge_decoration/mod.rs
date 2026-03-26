use crate::seq_features::{
    functionality::featdim::FeatDim,
};

mod compile;
mod featurize;

/// A single feature for computing [sequence charge decoration].
/// 
/// [sequence charge decoration]: https://doi.org/10.1063/1.5005821
pub struct SCD {
    enabled: bool,
}
impl FeatDim for SCD {
    fn featdim(&self) -> usize {
        self.enabled as usize
    }
}
