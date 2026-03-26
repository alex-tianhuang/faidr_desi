use crate::{
    datatypes::aa_canonical_str,
    seq_features::{
        functionality::featurize::FeaturizableSeqFeats,
        implementors::simple_spacing::{
            SimpleSpacingContainer, SimpleSpacingDelta, SimpleSpacingError, SimpleSpacingOmega,
        },
    },
};
use std::{convert::identity, iter::repeat_with};

impl FeaturizableSeqFeats for SimpleSpacingContainer {
    type Ctx<'a> = ();
    type Err = SimpleSpacingError;
    /// Part of the [`FeaturizableSeqFeats`] template.
    ///
    /// Computes simple spacing features with one or
    /// two residue groups, see [`compute_simple_spacing_delta`]
    /// and [`compute_simple_spacing_omega`].
    fn featurize<'a>(
        &self,
        sequence: &aa_canonical_str,
        _ctx: Self::Ctx<'a>,
    ) -> impl Iterator<Item = Result<f64, Self::Err>> {
        let SimpleSpacingContainer { deltas, omegas } = self;
        let mut deltas = deltas.iter();
        let mut omegas = omegas.iter();
        repeat_with(move || {
            deltas
                .next()
                .map(|feature| compute_simple_spacing_delta(feature, sequence))
                .or_else(|| {
                    omegas
                        .next()
                        .map(|feature| compute_simple_spacing_omega(feature, sequence))
                })
        })
        .map_while(identity)
    }
}

/// Helper function for [`SimpleSpacingContainer::featurize`].
///
/// Computes spacing for two opposing residue groups, based on
/// counting the actual and expected number of blobs.
/// See [`super`] module level docs and [`SimpleSpacingDelta`].
fn compute_simple_spacing_delta(
    feature: &SimpleSpacingDelta,
    sequence: &aa_canonical_str,
) -> Result<f64, SimpleSpacingError> {
    let SimpleSpacingDelta {
        ref res_group_a,
        ref res_group_b,
        blob_size,
    } = *feature;
    let mut sites = sequence
        .into_iter()
        .enumerate()
        .filter(|(_, aa)| res_group_a.contains(*aa) || res_group_b.contains(*aa))
        .map(|(idx, aa)| (idx, res_group_a.contains(aa)));
    let Some((mut prev_site, mut prev_grp_a)) = sites.next() else {
        return Err(SimpleSpacingError::Depleted {
            res_group: res_group_a.union(res_group_b),
        });
    };
    let mut a_sites_count = prev_grp_a as usize;
    let mut b_sites_count = (!prev_grp_a) as usize;
    let mut blobs_count = 0;
    for (site, grp_a) in sites {
        a_sites_count += grp_a as usize;
        b_sites_count += (!grp_a) as usize;
        if site - prev_site < blob_size as usize && prev_grp_a == grp_a {
            blobs_count += 1;
        }
        prev_site = site;
        prev_grp_a = grp_a;
    }
    if a_sites_count == sequence.len() {
        return Err(SimpleSpacingError::Saturated {
            res_group: res_group_a.clone(),
        });
    }
    if b_sites_count == sequence.len() {
        return Err(SimpleSpacingError::Saturated {
            res_group: res_group_b.clone(),
        });
    }
    let p = probability_of_blob_delta(
        a_sites_count,
        b_sites_count,
        sequence.len(),
        blob_size as i32,
    );
    Ok(binomial_z_score(
        blobs_count,
        p,
        a_sites_count + b_sites_count,
    ))
}
/// Helper function for an delta simple spacing feature.
///
/// Compute the probability of each residue in one of two residue groups
/// to be part of a "blob". In other words, compute the probability
/// that the next residue in the same residue group comes before
/// `blob_size` aminoacids and also before any residues in the opposite
/// residue group.
fn probability_of_blob_delta(
    a_sites_count: usize,
    b_sites_count: usize,
    sequence_len: usize,
    blob_size: i32,
) -> f64 {
    let sites_count = a_sites_count + b_sites_count;
    let prob_a_or_b_in_blob = probability_of_blob_omega(sites_count, sequence_len, blob_size);
    let prob_next_a_or_b_is_different =
        (2 * a_sites_count * b_sites_count) as f64 / (sites_count * sites_count) as f64;
    let prob_next_a_or_b_is_same = 1.0 - prob_next_a_or_b_is_different;
    prob_a_or_b_in_blob * prob_next_a_or_b_is_same
}
/// Helper function for [`SimpleSpacingContainer::featurize`].
///
/// Computes spacing for a single residue group, based on
/// counting the actual and expected number of blobs.
/// See [`super`] module level docs and [`SimpleSpacingOmega`].
fn compute_simple_spacing_omega(
    feature: &SimpleSpacingOmega,
    sequence: &aa_canonical_str,
) -> Result<f64, SimpleSpacingError> {
    let SimpleSpacingOmega {
        ref res_group,
        blob_size,
    } = *feature;
    let mut sites = sequence
        .into_iter()
        .enumerate()
        .filter(|(_, aa)| res_group.contains(*aa))
        .map(|(idx, _)| idx);
    let Some(mut prev_site) = sites.next() else {
        return Err(SimpleSpacingError::Depleted {
            res_group: res_group.clone(),
        });
    };
    let mut sites_count = 1;
    let mut blobs_count = 0;
    for site in sites {
        sites_count += 1;
        if site - prev_site < blob_size as usize {
            blobs_count += 1;
        }
        prev_site = site;
    }
    if sites_count == sequence.len() {
        return Err(SimpleSpacingError::Saturated {
            res_group: res_group.clone(),
        });
    }
    let p = probability_of_blob_omega(sites_count, sequence.len(), blob_size as i32);
    Ok(binomial_z_score(blobs_count, p, sites_count))
}
/// Helper function for [`compute_simple_spacing_omega`].
///
/// Compute the probability of each residue in this residue group
/// to be part of a "blob". In other words, compute the probability
/// that the next residue in the residue group appears before
/// `blob_size` aminoacids.
fn probability_of_blob_omega(sites_count: usize, sequence_len: usize, blob_size: i32) -> f64 {
    let res_group_frequency = sites_count as f64 / sequence_len as f64;
    1.0 - (1.0 - res_group_frequency).powi(blob_size)
}
/// Helper functions for simple spacing features.
///
/// Compute a z-score based on the actual number of successes
/// (`n_successes`) vs. the expected given by the parameters of a
/// simple binomial model (`p` and `n_trials`).
fn binomial_z_score(n_successes: usize, p: f64, n_trials: usize) -> f64 {
    let mean_neighbours = p * n_trials as f64;
    let sd_neighbours = (p * (1.0 - p) * n_trials as f64).sqrt();
    (n_successes as f64 - mean_neighbours) / sd_neighbours
}
