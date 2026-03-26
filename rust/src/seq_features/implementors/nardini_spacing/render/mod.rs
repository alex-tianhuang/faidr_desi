use crate::{
    Graphic,
    datatypes::{AASet, aa_canonical_str, render::LinePlot},
    seq_features::{
        contexts::common::ResidueCounts,
        functionality::{featdim::FeatDim, render::RenderableSeqFeats},
        implementors::nardini_spacing::{
            NardiniSpacingError,
            featurize::{generate_sliding_window_psis, generate_sliding_window_sigmas},
        },
    },
};
use std::{convert::identity, iter::repeat_with};
mod compile;

/// Single renderable NARDINI feature.
///
/// Same as [`super::NardiniDelta`] but no need
/// to specify RNG and number of scrambles.
#[derive(PartialEq)]
pub struct NardiniDeltaRenderable {
    res_group_a: AASet,
    res_group_b: AASet,
    window_size: u32,
}
/// Single renderable NARDINI feature.
///
/// Same as [`super::NardiniOmega`] but no need
/// to specify RNG and number of scrambles.
#[derive(PartialEq)]
pub struct NardiniOmegaRenderable {
    res_group: AASet,
    window_size: u32,
}
/// Container for [NARDINI] spacing features for rendering.
///
/// Just the same as [`super::NardiniSpacing`] but no need
/// to specify RNG and number of scrambles.
pub struct NardiniSpacingRenderable {
    deltas: Vec<NardiniDeltaRenderable>,
    omegas: Vec<NardiniOmegaRenderable>,
}
impl RenderableSeqFeats for NardiniSpacingRenderable {
    type Ctx<'a> = &'a ResidueCounts;
    type Err = NardiniSpacingError;
    /// Part of the [`RenderableSeqFeats`] template.
    ///
    /// Renders the sliding window [NARDINI] parameters.
    /// See [`render_nardini_delta`]
    /// and [`render_nardini_omega`]
    /// for more detailed implementations.
    ///
    /// [NARDINI]: https://doi.org/10.1016/j.jmb.2021.167373
    fn render<'a>(
        &self,
        sequence: &aa_canonical_str,
        ctx: Self::Ctx<'a>,
    ) -> impl Iterator<Item = Result<Graphic, Self::Err>> {
        let NardiniSpacingRenderable { deltas, omegas } = self;
        let mut deltas = deltas.iter();
        let mut omegas = omegas.iter();
        repeat_with(move || {
            deltas
                .next()
                .map(|feature| render_nardini_delta(feature, sequence, ctx))
                .or_else(|| {
                    omegas
                        .next()
                        .map(|feature| render_nardini_omega(feature, sequence, ctx))
                })
        })
        .map_while(identity)
    }
}

/// Renders the "sigma" parameter described in the
/// [NARDINI] algorithm for computing delta features.
///
/// Shows compositional asymmetry.
///
/// [NARDINI]: https://doi.org/10.1016/j.jmb.2021.167373
fn render_nardini_delta(
    feature: &NardiniDeltaRenderable,
    sequence: &aa_canonical_str,
    residue_counts: &ResidueCounts,
) -> Result<Graphic, NardiniSpacingError> {
    let NardiniDeltaRenderable {
        ref res_group_a,
        ref res_group_b,
        window_size,
    } = *feature;
    if sequence.len() < window_size as usize {
        return Err(NardiniSpacingError::SequenceTooShort);
    }
    let count_threshold = sequence.len() as f64 * 0.1;
    let count_a = residue_counts.count_residue_group(res_group_a);
    if (count_a as f64) < count_threshold {
        return Err(NardiniSpacingError::Depleted {
            res_group: res_group_a.clone(),
        });
    }
    let count_b = residue_counts.count_residue_group(res_group_b);
    if (count_b as f64) < count_threshold {
        return Err(NardiniSpacingError::Depleted {
            res_group: res_group_b.clone(),
        });
    }
    let diff = count_a - count_b;
    let denom = ((count_a + count_b) * sequence.len()) as f64;
    let global_sigma = (diff * diff) as f64 / denom;
    let mut data = Vec::with_capacity(sequence.len() - window_size as usize + 1);
    data.extend(
        generate_sliding_window_sigmas(sequence, res_group_a, res_group_b, window_size as usize)
            .map(|sigma| sigma - global_sigma),
    );
    let start = (window_size + 1) as f64 / 2.0;
    Ok(Graphic::LinePlot(LinePlot { data, start }))
}

/// Render the "psi" parameter described in the
/// [NARDINI] algorithm for omega features.
///
/// Omega is a special version of delta where one of the residue
/// groups is an exact set complement of the other residue group.
///
/// [NARDINI]: https://doi.org/10.1016/j.jmb.2021.167373
pub fn render_nardini_omega(
    feature: &NardiniOmegaRenderable,
    sequence: &aa_canonical_str,
    residue_counts: &ResidueCounts,
) -> Result<Graphic, NardiniSpacingError> {
    let NardiniOmegaRenderable {
        ref res_group,
        window_size,
    } = *feature;
    if sequence.len() < window_size as usize {
        return Err(NardiniSpacingError::SequenceTooShort);
    }
    let count = residue_counts.count_residue_group(res_group);
    let count_threshold = sequence.len() as f64 * 0.1;
    if (count as f64) < count_threshold {
        return Err(NardiniSpacingError::Depleted {
            res_group: res_group.clone(),
        });
    }
    if ((sequence.len() - count) as f64) < count_threshold {
        return Err(NardiniSpacingError::Saturated {
            res_group: res_group.clone(),
        });
    }
    let diff = (2 * count) as f64 / sequence.len() as f64 - 1.0;
    let global_psi = diff * diff;
    let mut data = Vec::with_capacity(sequence.len() - window_size as usize + 1);
    data.extend(
        generate_sliding_window_psis(sequence, res_group, window_size as usize)
            .map(|psi| psi - global_psi),
    );
    let start = (window_size + 1) as f64 / 2.0;
    Ok(Graphic::LinePlot(LinePlot { data, start }))
}
impl FeatDim for NardiniSpacingRenderable {
    fn featdim(&self) -> usize {
        self.deltas.len() + self.omegas.len()
    }
}
