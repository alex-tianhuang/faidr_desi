use bumpalo::Bump;

use crate::{
    datatypes::aa_canonical_str,
    seq_features::contexts::{
        common::{ArenaCtx, ResidueCounts},
        featurize::composite::Ctx2,
    },
};

/// A context provider for the current featurizer
/// (as of Feb 16th, 2026).
///
/// A context provider helps provide a buffer, on which
/// to compute shared sequence information or shared resources,
/// as described in these [macro docs].
///
/// [macro docs]: super::r#macro::define_compiler_and_featurizer
#[derive(Default)]
pub struct FeaturizerContextProvider {
    residue_counts: Option<ResidueCounts>,
    arena: Option<Bump>,
}
impl FeaturizerContextProvider {
    /// Public constructor.
    pub fn new(needs_residue_counts: bool, needs_arena: bool) -> Self {
        Self {
            residue_counts: needs_residue_counts.then(ResidueCounts::default),
            arena: needs_arena.then(Bump::default),
        }
    }
    /// Run during the first stage of the
    /// *featurization* stage described in the [macro docs].
    ///
    /// If the residue counts are needed, computes them.
    /// If a memory arena is being used, reset it.
    ///
    /// [macro docs]: super::r#macro::define_compiler_and_featurizer
    pub fn compute(&mut self, sequence: &aa_canonical_str) {
        self.residue_counts
            .as_mut()
            .map(|counts| counts.compute(sequence));
    }
    /// Get the residue counts from the context provider.
    pub fn residue_counts(&self) -> &ResidueCounts {
        self.residue_counts
            .as_ref()
            .expect("compiler should have setup residue counts in provider")
    }
    /// Get some reusable memory from the context provider.
    pub fn arena(&mut self) -> ArenaCtx<'_> {
        ArenaCtx::new(
            self.arena
                .as_mut()
                .expect("compiler should have setup arena in provider"),
        )
    }
    /// Get a [`Ctx2`] context.
    ///
    /// As of Feb 16th, 2026, this is for nardini spacing and SCD.
    pub fn ctx2(&mut self) -> Ctx2<'_> {
        let Self {
            residue_counts,
            arena,
        } = self;
        Ctx2 {
            residue_counts: residue_counts
                .as_ref()
                .expect("compiler should have setup residue counts in provider"),
            arena: ArenaCtx::new(
                arena
                    .as_mut()
                    .expect("compiler should have setup arena in provider"),
            ),
        }
    }
}
