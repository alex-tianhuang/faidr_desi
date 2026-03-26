use serde::{Deserialize, Serialize};

use crate::{
    datatypes::{AASet, sequences::AACanonicalStringStrict},
    seq_features::{
        functionality::compile::{CompilableSeqFeats, CompilerImplementor},
        implementors::{DuplicateFeatureError, percent_resgroup::PercentResidueGroup},
    },
};

#[derive(Deserialize, Serialize)]
pub struct PercentResidueGroupUserFacing {
    res_group: AACanonicalStringStrict,
}
#[derive(Default)]
pub struct PercentResidueGroupCompiler<'a> {
    data: Vec<(&'a str, AASet)>,
}
impl<'a> CompilerImplementor<'a> for PercentResidueGroupCompiler<'a> {
    type Container = PercentResidueGroup;
    type Err = DuplicateFeatureError;
    type UserFacing = PercentResidueGroupUserFacing;
    /// Part of the [`CompilableSeqFeats`] template.
    ///
    /// Adds a single residue group to the set of residue groups to look at,
    /// checking for uniqueness.
    fn compile(&mut self, data: &Self::UserFacing, feature_id: &'a str) -> Result<(), Self::Err> {
        let res_group_new = data.res_group.into_iter().collect();
        if self
            .data
            .iter()
            .any(|(_, res_group_old)| res_group_old.ne(&res_group_new))
        {
            Err(DuplicateFeatureError)
        } else {
            self.data.push((feature_id, res_group_new));
            Ok(())
        }
    }
    /// Part of the [`CompilableSeqFeats`] template.
    ///
    /// Returns a [`PercentResidueGroup`] container for the
    /// given residue groups, and returns the feature IDs in the order
    /// they are associated with.
    fn finish(self, feature_ids: &mut Vec<&'a str>) -> Self::Container {
        let mut residue_groups = Vec::with_capacity(self.data.len());
        for (feature_id, res_group) in self.data {
            feature_ids.push(feature_id);
            residue_groups.push(res_group);
        }
        PercentResidueGroup { residue_groups }
    }
}
impl CompilableSeqFeats for PercentResidueGroup {
    type Compiler<'a> = PercentResidueGroupCompiler<'a>;
}
