use serde::{Deserialize, Serialize};

use crate::{
    datatypes::{AAMap, AASet, Aminoacid, StandardError},
    seq_features::{
        functionality::compile::{CompilableSeqFeats, CompilerImplementor},
        implementors::percent_residue::PercentResidue,
    },
};

/// A single aminoacid composition feature.
///
/// Marshallable.
#[derive(Deserialize, Serialize)]
pub struct PercentResidueUserFacing {
    residue: Aminoacid,
}
/// A compiler for all aminoacid composition features.
///
/// Prevents multiple instances of the same aminoacid composition feature.
#[derive(Default)]
pub struct PercentResidueCompiler<'a> {
    data: AAMap<Option<&'a str>>,
}
impl<'a> CompilerImplementor<'a> for PercentResidueCompiler<'a> {
    type UserFacing = PercentResidueUserFacing;
    type Container = PercentResidue;
    type Err = StandardError;
    /// Part of the [`CompilableSeqFeats`] template.
    ///
    /// Acts like an accumulator for [`PercentResidueUserFacing`]
    /// associated with a feature ID.
    fn compile(&mut self, data: &Self::UserFacing, feature_id: &'a str) -> Result<(), Self::Err> {
        let PercentResidueUserFacing { residue } = *data;
        if self.data[residue].is_some() {
            return Err(StandardError::from_str(&format!("percentage of {}s was defined multiple times", residue)));
        }
        self.data[residue] = Some(feature_id);
        Ok(())
    }
    /// Part of the [`CompilableSeqFeats`] template.
    ///
    /// Compiles to a [`PercentResidue`] container, which can be used
    /// to "compute" the composition of a sequence.
    fn finish(self, feature_ids: &mut Vec<&'a str>) -> Self::Container {
        let mut residues = AASet::default();
        for (aa, slot) in self.data {
            let Some(feature_id) = slot else { continue };
            feature_ids.push(feature_id);
            residues.add(aa);
        }
        PercentResidue { residues }
    }
}
impl CompilableSeqFeats for PercentResidue {
    type Compiler<'a> = PercentResidueCompiler<'a>;
}
