use std::convert::Infallible;

use crate::seq_features::{
    contexts::common::ResidueCounts, functionality::featurize::FeaturizableSeqFeats,
    implementors::percent_resgroup::PercentResidueGroup,
};

impl FeaturizableSeqFeats for PercentResidueGroup {
    type Ctx<'a> = &'a ResidueCounts;
    type Err = Infallible;
    /// Part of the [`FeaturizableSeqFeats`] template.
    /// 
    /// Computes the sum of all residues in each group.
    fn featurize<'a>(
            &self,
            sequence: &crate::datatypes::aa_canonical_str,
            ctx: Self::Ctx<'a>,
        ) -> impl Iterator<Item = Result<f32, Self::Err>> {
        self.residue_groups.iter().map(|res_group| {
            Ok(res_group.iter().map(|aa| ctx[aa]).sum::<usize>() as f32 / sequence.len() as f32)
        })
    }
}
