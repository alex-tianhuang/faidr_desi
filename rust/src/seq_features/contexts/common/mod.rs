//! Contexts used in featurization and rendering.
mod arena;
mod residue_counts;
pub use residue_counts::ResidueCounts;
pub use arena::{ArenaCtx, sliding_average, WindowTooLargeError};
