use crate::seq_features::{
    functionality::featdim::FeatDim,
};

mod compile;
mod featurize;

/// A single feature for computing [sequence hydropathy decoration].
/// 
/// [sequence hydropathy decoration]: https://pubs.acs.org/doi/10.1021/acs.jpclett.0c00288
pub struct SHD {
    enabled: bool,
}
impl FeatDim for SHD {
    fn featdim(&self) -> usize {
        self.enabled as usize
    }
}
