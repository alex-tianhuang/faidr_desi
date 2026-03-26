use crate::{
    datatypes::{AASet, aa_canonical_str},
    rng::Rng,
    seq_features::{
        contexts::featurize::composite::Ctx2,
        functionality::featurize::FeaturizableSeqFeats,
        implementors::nardini_spacing::{
            NardiniCommonParams, NardiniDelta, NardiniOmega, NardiniSpacing, NardiniSpacingError,
        },
    },
};
use std::{
    convert::identity,
    iter::{once, repeat_with},
};

impl FeaturizableSeqFeats for NardiniSpacing {
    type Ctx<'a> = Ctx2<'a>;
    type Err = NardiniSpacingError;
    /// Part of the [`FeaturizableSeqFeats`] template.
    ///
    /// Computes [NARDINI] clustering statistics.
    /// See [`compute_nardini_delta_z_score`]
    /// and [`compute_nardini_omega_z_score`]
    /// for more detailed implementations.
    ///
    /// [NARDINI]: https://doi.org/10.1016/j.jmb.2021.167373
    fn featurize<'a>(
        &self,
        sequence: &aa_canonical_str,
        mut ctx: Self::Ctx<'a>,
    ) -> impl Iterator<Item = Result<f32, Self::Err>> {
        let NardiniSpacing { deltas, omegas } = self;
        let mut deltas = deltas.iter();
        let mut omegas = omegas.iter();
        repeat_with(move || {
            deltas
                .next()
                .map(|feature| compute_nardini_delta_z_score(feature, sequence, &mut ctx))
                .or_else(|| {
                    omegas
                        .next()
                        .map(|feature| compute_nardini_omega_z_score(feature, sequence, &mut ctx))
                })
        })
        .map_while(identity)
    }
}

/// Compute a "delta" z-statistic using the [NARDINI] algorithm.
/// This is not to be confused with the value of delta itself,
/// described in [`compute_unnormalized_delta`].
///
/// [NARDINI]: https://doi.org/10.1016/j.jmb.2021.167373
fn compute_nardini_delta_z_score(
    feature: &NardiniDelta,
    sequence: &aa_canonical_str,
    ctx: &mut Ctx2<'_>,
) -> Result<f32, NardiniSpacingError> {
    let NardiniDelta {
        ref res_group_a,
        ref res_group_b,
        params:
            NardiniCommonParams {
                window_size,
                n_scrambled_trials,
                ref rng,
            },
    } = *feature;
    if sequence.len() < window_size as usize {
        return Err(NardiniSpacingError::SequenceTooShort);
    }
    let count_threshold = sequence.len() as f32 * 0.1;
    let count_a = ctx.residue_counts.count_residue_group(res_group_a);
    if (count_a as f32) < count_threshold {
        return Err(NardiniSpacingError::Depleted {
            res_group: res_group_a.clone(),
        });
    }
    let count_b = ctx.residue_counts.count_residue_group(res_group_b);
    if (count_b as f32) < count_threshold {
        return Err(NardiniSpacingError::Depleted {
            res_group: res_group_b.clone(),
        });
    }
    let diff = count_a - count_b;
    let denom = ((count_a + count_b) * sequence.len()) as f32;
    let global_sigma = (diff * diff) as f32 / denom;
    let test_delta = compute_unnormalized_delta(
        sequence,
        res_group_a,
        res_group_b,
        window_size as usize,
        global_sigma,
    );
    let mut sum_samples = 0.0;
    let mut sum_samples_sqr = 0.0;
    for null_sample_delta in ctx
        .generate_shuffles(Rng::new(rng))
        .map(|sequence| {
            compute_unnormalized_delta(
                sequence,
                res_group_a,
                res_group_b,
                window_size as usize,
                global_sigma,
            )
        })
        .take(n_scrambled_trials as usize)
    {
        sum_samples += null_sample_delta;
        sum_samples_sqr += null_sample_delta * null_sample_delta;
    }
    let n = n_scrambled_trials as f32;
    let num = test_delta * n - sum_samples;
    let denom = (sum_samples_sqr * n - sum_samples * sum_samples).sqrt();
    Ok(num / denom)
}
/// Helper function for [`compute_nardini_delta_z_score`].
///
/// Computes the `delta` parameter for one sequence.
///
/// As described in the [NARDINI] paper, this involves computing the
/// squared deviation of the asymmetry parameter sigma:
/// `σ := (fa - fb) ** 2 / (fa + fb)`
/// (they replace the `a` and `b` with `x` and `y` in their formula).
///
/// Comparison is done between the expected value over sliding windows
/// and the global value.
///
/// [NARDINI]: https://doi.org/10.1016/j.jmb.2021.167373
fn compute_unnormalized_delta(
    sequence: &aa_canonical_str,
    res_group_a: &AASet,
    res_group_b: &AASet,
    window_size: usize,
    global_sigma: f32,
) -> f32 {
    let mut sum_asymmetry_sqr = 0.0;
    for sigma in generate_sliding_window_sigmas(sequence, res_group_a, res_group_b, window_size) {
        let asym = sigma - global_sigma;
        sum_asymmetry_sqr += asym * asym;
    }
    sum_asymmetry_sqr / (sequence.len() - window_size + 1) as f32
}
/// Helper for [`compute_unnormalized_delta`] and rendering functions.
///
/// For each sliding window over the sequence (of size `window_size`),
/// computes the sigma parameter (see [`compute_unnormalized_delta`]).
pub(super) fn generate_sliding_window_sigmas(
    sequence: &aa_canonical_str,
    res_group_a: &AASet,
    res_group_b: &AASet,
    window_size: usize,
) -> impl Iterator<Item = f32> {
    let sequence = sequence.as_slice();
    let first_window = &sequence[..window_size];
    let mut window_a_count = 0;
    let mut window_b_count = 0;
    for &aa in first_window.iter() {
        if res_group_a.contains(aa) {
            window_a_count += 1;
        }
        if res_group_b.contains(aa) {
            window_b_count += 1;
        }
    }
    let mut denom = window_a_count + window_b_count;
    let mut diff = window_a_count - window_b_count;
    let sigma = if denom > 0 {
        denom *= window_size as i32;
        (diff * diff) as f32 / denom as f32
    } else {
        0.0
    };
    let tail = &sequence[..sequence.len() - window_size];
    let head = &sequence[window_size..];
    let mut first_sigma = once(sigma);
    let mut window_edges = tail.iter().zip(head);
    repeat_with(move || {
        first_sigma.next().or_else(|| {
            window_edges.next().map(|(&prev_aa, &next_aa)| {
                if res_group_a.contains(prev_aa) {
                    denom -= window_size as i32;
                    diff -= 1;
                }
                if res_group_b.contains(prev_aa) {
                    denom -= window_size as i32;
                    diff += 1;
                }
                if res_group_a.contains(next_aa) {
                    denom += window_size as i32;
                    diff += 1;
                }
                if res_group_b.contains(next_aa) {
                    denom += window_size as i32;
                    diff -= 1;
                }
                if denom > 0 {
                    denom *= window_size as i32;
                    (diff * diff) as f32 / denom as f32
                } else {
                    0.0
                }
            })
        })
    })
    .map_while(identity)
}
/// Compute an "omega" z-statistic using the [NARDINI] algorithm.
/// Omega is a special version of delta where one of the residue
/// groups is an exact set complement of the other residue group.
///
/// This is not to be confused with the value of omega itself,
/// described in [`compute_unnormalized_omega`].
///
/// [NARDINI]: https://doi.org/10.1016/j.jmb.2021.167373
fn compute_nardini_omega_z_score(
    feature: &NardiniOmega,
    sequence: &aa_canonical_str,
    ctx: &mut Ctx2<'_>,
) -> Result<f32, NardiniSpacingError> {
    let NardiniOmega {
        ref res_group,
        params:
            NardiniCommonParams {
                window_size,
                n_scrambled_trials,
                ref rng,
            },
    } = *feature;
    if sequence.len() < window_size as usize {
        return Err(NardiniSpacingError::SequenceTooShort);
    }
    let count = ctx.residue_counts.count_residue_group(res_group);
    let count_threshold = sequence.len() as f32 * 0.1;
    if (count as f32) < count_threshold {
        return Err(NardiniSpacingError::Depleted {
            res_group: res_group.clone(),
        });
    }
    if ((sequence.len() - count) as f32) < count_threshold {
        return Err(NardiniSpacingError::Saturated {
            res_group: res_group.clone(),
        });
    }
    let diff = (2 * count) as f32 / sequence.len() as f32 - 1.0;
    let global_psi = diff * diff;
    let test_omega =
        compute_unnormalized_omega(sequence, res_group, window_size as usize, global_psi);
    let mut sum_samples = 0.0;
    let mut sum_samples_sqr = 0.0;
    for null_sample_omega in ctx
        .generate_shuffles(Rng::new(rng))
        .map(|sequence| {
            compute_unnormalized_omega(sequence, res_group, window_size as usize, global_psi)
        })
        .take(n_scrambled_trials as usize)
    {
        sum_samples += null_sample_omega;
        sum_samples_sqr += null_sample_omega * null_sample_omega;
    }
    let n = n_scrambled_trials as f32;
    let num = test_omega * n - sum_samples;
    let denom = (sum_samples_sqr * n - sum_samples * sum_samples).sqrt();
    Ok(num / denom)
}

/// Helper function for [`compute_nardini_omega_z_score`].
///
/// Computes the `omega` parameter for one sequence.
///
/// As described in the [NARDINI] paper, this involves computing the
/// squared deviation of the asymmetry parameter psi:
/// `ψ := (fa - fb) ** 2`
///
/// This is the same formula as sigma in [`compute_unnormalized_delta`]
/// except `fa + fb = 1`.
///
/// (Again, the paper has `fx` and `fy` instead of `fa` and `fb`).
///
/// Comparison is done between the expected value over sliding windows
/// and the global value.
///
/// [omega z-score calculations]: NardiniOmega::compute_numeric
/// [NARDINI]: https://doi.org/10.1016/j.jmb.2021.167373
fn compute_unnormalized_omega(
    sequence: &aa_canonical_str,
    res_group: &AASet,
    window_size: usize,
    global_psi: f32,
) -> f32 {
    let mut sum_asymmetry_sqr = 0.0;
    for psi in generate_sliding_window_psis(sequence, res_group, window_size) {
        let asym = psi - global_psi;
        sum_asymmetry_sqr += asym * asym;
    }
    sum_asymmetry_sqr / (sequence.len() - window_size + 1) as f32
}

/// Helper for [`compute_unnormalized_omega`] and rendering functions.
///
/// For each sliding window over the sequence (of size `window_size`),
/// computes the psi parameter (see [`compute_unnormalized_omega`]).
pub(super) fn generate_sliding_window_psis(
    sequence: &aa_canonical_str,
    res_group: &AASet,
    window_size: usize,
) -> impl Iterator<Item = f32> {
    let sequence = sequence.as_slice();
    let first_window = &sequence[..window_size];
    let window_count: i32 = first_window
        .iter()
        .filter(|&&aa| res_group.contains(aa))
        .count()
        .try_into()
        .expect("failed to convert number of residues into `i32` (sequence too large)");
    let mut diff = 2 * window_count - window_size as i32;
    let psi = (diff * diff) as f32 / window_size as f32;
    let tail = &sequence[..sequence.len() - window_size];
    let head = &sequence[window_size..];
    let mut first_psi = once(psi);
    let mut window_edges = tail.iter().zip(head);
    repeat_with(move || {
        first_psi.next().or_else(|| {
            window_edges.next().map(|(&prev_aa, &next_aa)| {
                if res_group.contains(prev_aa) {
                    diff -= 1;
                } else {
                    diff += 1;
                }
                if res_group.contains(next_aa) {
                    diff += 1;
                } else {
                    diff -= 1;
                }
                (diff * diff) as f32 / window_size as f32
            })
        })
    })
    .map_while(identity)
}
