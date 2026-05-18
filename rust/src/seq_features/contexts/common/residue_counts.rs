use crate::datatypes::{AAMap, AASet, aa_canonical_str};
use std::ops::Deref;

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
