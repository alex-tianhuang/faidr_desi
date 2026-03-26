use crate::{
    datatypes::{AAMap, Aminoacid, aa_canonical_str, const_aamap},
    seq_features::{
        contexts::common::ArenaCtx, functionality::featurize::FeaturizableSeqFeats,
        implementors::sequence_hydropathy_decoration::SHD,
    },
};
use bumpalo::{Bump, collections::Vec};
use std::convert::Infallible;

impl FeaturizableSeqFeats for SHD {
    type Ctx<'a> = ArenaCtx<'a>;
    type Err = Infallible;
    /// Part of the [`FeaturizableSeqFeats`] template.
    ///
    /// Computes a measure of hydropathy patterning,
    /// is a wrapper around [`compute_shd`].
    fn featurize<'a>(
        &self,
        sequence: &aa_canonical_str,
        mut ctx: Self::Ctx<'a>,
    ) -> impl Iterator<Item = Result<f32, Self::Err>> {
        self.enabled
            .then(|| {
                Ok(compute_shd(
                    sequence,
                    &NORMALIZED_KYTE_DOOLITLE_HYDROPHOBICITY,
                    ctx.get_memory(),
                ))
            })
            .into_iter()
    }
}
/// Scale for hydropathy by residue.
/// Copied from [Alex Holehouse lab's github].
///
/// [Alex Holehouse lab's github]: https://github.com/idptools/sparrow/blob/57324b7102e08d98e0c4dc4db1813f1c0583a60f/sparrow/patterning/scd.pyx
const NORMALIZED_KYTE_DOOLITLE_HYDROPHOBICITY: AAMap<f32> = {
    const_aamap! {
        [
            (_, 0.0),
            (Aminoacid::A, 0.730),
            (Aminoacid::R, 0.000),
            (Aminoacid::N, 0.432),
            (Aminoacid::D, 0.378),
            (Aminoacid::C, 0.595),
            (Aminoacid::Q, 0.514),
            (Aminoacid::E, 0.459),
            (Aminoacid::G, 0.649),
            (Aminoacid::H, 0.514),
            (Aminoacid::I, 0.973),
            (Aminoacid::L, 0.973),
            (Aminoacid::K, 0.514),
            (Aminoacid::M, 0.838),
            (Aminoacid::F, 1.000),
            (Aminoacid::P, 1.000),
            (Aminoacid::S, 0.595),
            (Aminoacid::T, 0.676),
            (Aminoacid::W, 0.946),
            (Aminoacid::Y, 0.865),
            (Aminoacid::V, 0.892)
        ]
    }
};
/// Function doing the work for [`SHD::featurize`].
fn compute_shd(sequence: &aa_canonical_str, hydropathy_scale: &AAMap<f32>, arena: &Bump) -> f32 {
    compute_shd_custom(sequence, hydropathy_scale, arena)
}
/// First pass at computing SHD, copied from [Alex Holehouse lab's github].
///
/// [Alex Holehouse lab's github]: https://github.com/idptools/sparrow/blob/57324b7102e08d98e0c4dc4db1813f1c0583a60f/sparrow/patterning/scd.pyx
#[allow(unused)]
fn compute_shd_holehouse(sequence: &aa_canonical_str, hydropathy_scale: &AAMap<f32>, arena: &Bump) -> f32 {
    let h_scores_buf =
        arena.alloc_slice_fill_iter(sequence.into_iter().map(|aa| hydropathy_scale[aa]));
    let mut shd_sum = 0.0;
    for m in 1..sequence.len() {
        for n in 0..m {
            shd_sum += (h_scores_buf[n] + h_scores_buf[m]) / (m - n) as f32;
        }
    }
    shd_sum / sequence.len() as f32
}
/// A maybe faster implementation of [`compute_shd_holehouse`]
/// that is mathematically equivalent.
///
/// Dev note
/// --------
/// Mostly I optimized this function for entertainment.
/// It is not yet tested, and may be harder to maintain.
/// Oh well!
fn compute_shd_custom(sequence: &aa_canonical_str, hydropathy_scale: &AAMap<f32>, arena: &Bump) -> f32 {
    let mut harmonic_sum = 0.0;
    let mut harmonic_sums_buf = Vec::with_capacity_in(sequence.len(), arena);
    harmonic_sums_buf.push(0.0);
    for n in 1..sequence.len() {
        harmonic_sum += 1.0 / n as f32;
        harmonic_sums_buf.push(harmonic_sum);
    }
    let mut shd_sum = 0.0;
    let mut n = 0;
    let mut m = sequence.len();
    for aa in sequence {
        shd_sum += hydropathy_scale[aa] * (harmonic_sums_buf[n] + harmonic_sums_buf[m - 1]);
        n += 1;
        m -= 1;
    }
    shd_sum / sequence.len() as f32
}
