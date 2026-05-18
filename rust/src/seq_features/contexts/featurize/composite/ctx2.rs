//! [`Ctx2`], a context with [`ResidueCounts`] and an arena.
use crate::seq_features::contexts::common::{ArenaCtx, ResidueCounts};

/// A composite context containing
/// resuable memory and residue counts.
///
/// Used in nardini-spacing features and SCD.
pub struct Ctx2<'a> {
    pub arena: ArenaCtx<'a>,
    pub residue_counts: &'a ResidueCounts,
}
