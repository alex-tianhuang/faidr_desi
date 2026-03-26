//! [`Ctx2`], a context with [`ResidueCounts`] and an arena.
use crate::{
    datatypes::{Aminoacid, aa_canonical_str},
    rng::Rng,
    seq_features::contexts::common::{ArenaCtx, ResidueCounts},
};
use bumpalo::collections::Vec;
use rand::seq::SliceRandom;
use std::iter::{repeat, repeat_with};

/// A composite context containing
/// resuable memory and residue counts.
///
/// Used in nardini-spacing features and SCD.
pub struct Ctx2<'a> {
    pub arena: ArenaCtx<'a>,
    pub residue_counts: &'a ResidueCounts,
}
impl<'a> Ctx2<'a> {
    /// Create a generator of shuffled variants of a given sequence,
    /// which mutably borrows this [`Ctx2`].
    pub fn generate_shuffles(&mut self, rng: Rng) -> GenerateShuffles<'_> {
        let mut buf = Vec::with_capacity_in(
            self.residue_counts.values().sum::<usize>(),
            self.arena.get_memory(),
        );
        buf.extend(
            self.residue_counts
                .iter()
                .map(|(aa, count)| repeat(aa).take(*count))
                .flatten(),
        );
        GenerateShuffles { buf, rng }
    }
}
/// An unbounded generator of shuffled sequences.
///
/// You can either call [`GenerateShuffles::next`]
/// or [`GenerateShuffles::map`] to access the shuffles.
///
/// If you use [`GenerateShuffles::map`], use one of
/// the iterator adaptors (like [`Iterator::take`] or
/// [`Iterator::take_while`]) to bound the iterator.
///
/// Assumed that `buf` is preloaded with
/// the correct compositional profile.
pub struct GenerateShuffles<'a> {
    buf: Vec<'a, Aminoacid>,
    rng: Rng,
}
impl<'a> GenerateShuffles<'a> {
    /// Turn this from a [`GenerateShuffles`] into an
    /// iterator that yields `R`.
    pub fn map<F: for<'b> FnMut(&'b aa_canonical_str) -> R, R>(
        mut self,
        mut f: F,
    ) -> impl use<'a, F, R> + Iterator<Item = R> {
        repeat_with(move || f(self.next()))
    }
    /// Generate a shuffled sequence.
    ///
    /// Dev note
    /// --------
    /// This is almost like an iterator, but iterators
    /// require that the return type does not use
    /// the mutable borrow lifetime.
    pub fn next(&mut self) -> &aa_canonical_str {
        self.buf.shuffle(&mut self.rng);
        aa_canonical_str::new(&self.buf)
    }
}
