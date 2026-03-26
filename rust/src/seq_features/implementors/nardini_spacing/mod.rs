use serde::{Deserialize, Serialize};
use thiserror::Error;

use crate::{
    datatypes::AASet,
    rng::RngSpec,
    seq_features::{
        functionality::featdim::FeatDim,
    },
};
pub(crate) mod compile;
mod featurize;
mod render;
/// A feature to compute the clustering of two opposing residue groups.
///
/// Described in the [NARDINI] paper.
///
/// Dev note
/// --------
/// Feature is symmetric in two residue groups, therefore
/// by convention `res_group_a` < `res_group_b` (via [`AASet::partial_cmp`]).
///
/// [NARDINI]: https://doi.org/10.1016/j.jmb.2021.167373
#[derive(PartialEq)]
pub struct NardiniDelta {
    /// One of the residue groups to have NARDINI delta statistic computed on.
    res_group_a: AASet,
    /// The other of the residue groups to have NARDINI delta statistic computed on.
    res_group_b: AASet,
    params: NardiniCommonParams,
}
/// A feature to compute the clustering of a single residue group.
///
/// Described in the [NARDINI] paper.
///
/// [NARDINI]: https://doi.org/10.1016/j.jmb.2021.167373
#[derive(PartialEq)]
pub struct NardiniOmega {
    /// Residue group to have NARDINI omega statistic computed on.
    res_group: AASet,
    params: NardiniCommonParams,
}
/// Data that is used for all NARDINI spacing features.
#[derive(Deserialize, Serialize, PartialEq, Clone)]
pub struct NardiniCommonParams {
    /// The window size for the algorithm.
    window_size: u32,
    /// The number of scrambled sequences to compute the
    /// distribution of null nardini parameters from.
    n_scrambled_trials: u32,
    /// A deterministic specification of the RNG.
    rng: RngSpec,
}
/// Container for [NARDINI] spacing features.
///
/// They involve computing a sliding window of compositional
/// assymmetry -see the [`featurize`] module or the linked paper.
///
/// [NARDINI]: https://doi.org/10.1016/j.jmb.2021.167373
pub struct NardiniSpacing {
    deltas: Vec<NardiniDelta>,
    omegas: Vec<NardiniOmega>,
}
impl FeatDim for NardiniSpacing {
    fn featdim(&self) -> usize {
        self.deltas.len() + self.omegas.len()
    }
}

/// Error enum returned when doing a nardini-spacing calculation.
///
/// If the proportion of residues in is less than 10% or
/// greater than 90%, the [NARDINI] paper computes a default
/// value of 0. I elected to let the user know explicitly, and
/// they can convert this case to 0 if they wish.
///
/// [NARDINI]: https://doi.org/10.1016/j.jmb.2021.167373
#[derive(Debug, Error)]
pub enum NardiniSpacingError {
    #[error("not enough {} (<10%) residues to compute NARDINI spacing", res_group.to_string())]
    Depleted { res_group: AASet },
    #[error("too many {} (>90%) residues to compute NARDINI spacing", res_group.to_string())]
    Saturated { res_group: AASet },
    #[error("sequence is too short to compute NARDINI spacing")]
    SequenceTooShort,
}
