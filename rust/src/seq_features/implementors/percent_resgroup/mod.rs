use crate::{datatypes::AASet, seq_features::functionality::featdim::FeatDim};
pub(crate) mod compile;
mod featurize;
mod render;
/// Collection of residue groups to compute the
/// percent of sequence spanned by a residue group.
pub struct PercentResidueGroup {
    residue_groups: Vec<AASet>,
}
impl FeatDim for PercentResidueGroup {
    fn featdim(&self) -> usize {
        self.residue_groups.len()
    }
}
