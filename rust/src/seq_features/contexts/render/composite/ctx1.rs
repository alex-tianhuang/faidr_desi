//! [`Ctx1`], a context containing a [`ResidueCounts`] and an arena.
use crate::seq_features::contexts::common::{ArenaCtx, ResidueCounts};

/// Context used to render simple-spacing features.
pub struct Ctx1<'a> {
    /// Residue counts for quickly computing composition.
    pub residue_counts: &'a ResidueCounts,
    /// Reusable memory.
    pub arena: ArenaCtx<'a>, 
}