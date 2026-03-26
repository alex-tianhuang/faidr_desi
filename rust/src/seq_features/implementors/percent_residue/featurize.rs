use crate::seq_features::{
    contexts::common::ResidueCounts, functionality::featurize::FeaturizableSeqFeats,
    implementors::percent_residue::PercentResidue,
};
use std::convert::Infallible;

impl FeaturizableSeqFeats for PercentResidue {
    type Ctx<'a> = &'a ResidueCounts;
    type Err = Infallible;
    /// Part of the [`FeaturizableSeqFeats`] template.
    ///
    /// Represents "computation" of the aminoacid composition
    /// for all aminoacids in this container.
    ///
    /// Dev note
    /// --------
    /// Truthfully, since [`ResidueCounts`] does this
    /// computation for all aminoacids, this container acts
    /// more like a filter for the computation done by
    /// [`ResidueCounts`].
    ///
    /// So why does this type exist?
    ///
    /// Because I didn't want other features to depend on this
    /// one. By using a [`ResidueCounts`], it's pretty clear
    /// that the computation of the [`ResidueCounts`] is a
    /// shared resource. This makes the flow of responsibility
    /// `sequence -> contexts -> seq feature implementors`,
    /// rather than having sequence features depend on each other.
    fn featurize<'a>(
        &self,
        sequence: &crate::datatypes::aa_canonical_str,
        ctx: Self::Ctx<'a>,
    ) -> impl Iterator<Item = Result<f64, Self::Err>> {
        self.residues
            .iter()
            .map(|aa| Ok(ctx[aa] as f64 / sequence.len() as f64))
    }
}
