//! Module of computing some simple-spacing features.
//!
//! These features rely on the concept of "blob"s.
//!
//! For a given residue group (say, charged), if two
//! residues of that group (e.g. charged residues)
//! are separated by less than 5 units of each other
//! (e.g. DXXXXR but not DXXXXXR), then that defines
//! a blob.
//!
//! The actual number of these blobs in a sequence
//! vs. the expected number as computed by a binomial
//! estimate gives a z-score which is this class of
//! feature.
use crate::{datatypes::AASet, seq_features::functionality::featdim::FeatDim};
use thiserror::Error;
pub(crate) mod compile;
mod featurize;

/// Parameters for a single, simple-spacing feature
/// that quantifies clustering of certain residues
/// in two alternating groups.
///
/// If the sequence is comprised entirely of either group
/// or does not both groups, the feature cannot be
/// computed.
///
/// Dev note
/// --------
/// This feature is symmetric in its two residue groups,
/// so I choose as a standard to have the "smaller"
/// residue group (determined arbitrarily by
/// [`AASet::partial_cmp`]) in `res_group_a`.
/// Container for multiple simple-spacing features.
#[derive(PartialEq)]
pub struct SimpleSpacingDelta {
    /// One of the residue groups over which to compute
    /// simple-spacing, mutually exclusive to the other
    /// residue group.
    res_group_a: AASet,
    /// One of the residue groups over which to compute
    /// simple-spacing, mutually exclusive to the other
    /// residue group.
    res_group_b: AASet,
    /// Size of a "blob". See module level docs for more detailed
    /// explanation, but essentially how close two residues need
    /// to be to be in the same cluster.
    blob_size: u32,
}

/// Parameters for a single, simple-spacing feature
/// that quantifies clustering of certain residues
/// in a given group.
///
/// If the sequence is comprised entirely of that group
/// or does not contain it at all, the feature cannot
/// be computed.
#[derive(PartialEq)]
pub struct SimpleSpacingOmega {
    /// Residue group over which to compute simple-spacing.
    res_group: AASet,
    /// Size of a "blob". See module level docs for more detailed
    /// explanation, but essentially how close two residues need
    /// to be to be in the same cluster.
    blob_size: u32,
}
/// Container for simple-spacing features. See
/// [`SimpleSpacingDelta`] and [`SimpleSpacingOmega`].
/// These features rely on the concept of "blob"s.
///
/// For a given residue group (say, charged), if two
/// residues of that group (e.g. charged residues)
/// are within 5 units of each other (e.g. DXXXR
/// but not DXXXXR), then that defines a blob.
///
/// The actual number of these blobs in a sequence
/// vs. the expected number as computed by a binomial
/// estimate gives a z-score which is this class of
/// feature.
pub struct SimpleSpacingContainer {
    deltas: Vec<SimpleSpacingDelta>,
    omegas: Vec<SimpleSpacingOmega>,
}
impl FeatDim for SimpleSpacingContainer {
    fn featdim(&self) -> usize {
        self.deltas.len() + self.omegas.len()
    }
}
/// Error that arises when doing a spacing computation,
/// depending on edge cases of composition.
#[derive(Debug, Error)]
pub enum SimpleSpacingError {
    #[error("cannot compute spacing (not enough {} residues)", res_group.to_string())]
    Depleted { res_group: AASet },
    #[error("cannot compute spacing (sequence is saturated with {} residues)", res_group.to_string())]
    Saturated { res_group: AASet },
}
