use crate::seq_features::functionality::featdim::FeatDim;
mod compile;
mod featurize;
/// Singleton container for the isoelectric point feature.
pub struct IsoelectricPoint {
    enabled: bool,
}
impl FeatDim for IsoelectricPoint {
    fn featdim(&self) -> usize {
        self.enabled as usize
    }
}
