//! Context structs for the featurizer.
use bumpalo::Bump;
use crate::datatypes::{AAMap, aa_canonical_str};
use std::ops::Deref;
/// Resuable memory.
/// 
/// I use this instead of a raw [`Bump`] to make sure
/// I reset the arena regularly.
pub struct ArenaCtx<'a>(&'a mut Bump);
impl<'a> ArenaCtx<'a> {
    /// Public constructor.
    pub fn new(arena: &'a mut Bump) -> Self {
        Self(arena)
    }
    /// Reset and return the underlying memory arena.
    pub fn get_memory(&mut self) -> &Bump {
        self.0.reset();
        &*self.0
    }
}

/// A context containing the counts of each residue type in a sequence.
///
/// Use like:
/// ```
/// let mut counts = ResidueCounts::default();
/// counts.compute(sequence);
/// for (aa, count) in counts.iter() {
///     /* ... */
/// }
/// ```
#[derive(Default)]
pub struct ResidueCounts(AAMap<usize>);
impl ResidueCounts {
    /// Count all the residues in a sequence.
    pub fn compute(&mut self, sequence: &aa_canonical_str) {
        let ResidueCounts(counter) = self;
        for (_, slot) in counter.iter_mut() {
            *slot = 0
        }
        for aa in sequence {
            counter[aa] += 1;
        }
    }
}
impl Deref for ResidueCounts {
    type Target = AAMap<usize>;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

/// A composite context containing
/// resuable memory and residue counts.
///
/// Used in SCD.
pub struct SCDCtx<'a> {
    pub arena: ArenaCtx<'a>,
    pub residue_counts: &'a ResidueCounts,
}
