use std::convert::Infallible;

use bumpalo::collections::Vec;

use crate::{
    datatypes::{Aminoacid, aa_canonical_str},
    seq_features::{
        contexts::featurize::composite::Ctx2, functionality::featurize::FeaturizableSeqFeats,
        implementors::sequence_charge_decoration::SCD,
    },
};

impl FeaturizableSeqFeats for SCD {
    type Ctx<'a> = Ctx2<'a>;
    type Err = Infallible;
    /// Part of the [`FeaturizableSeqFeats`] template.
    ///
    /// Computes a measure of hydropathy patterning,
    /// is a wrapper around [`compute_scd`].
    fn featurize<'a>(
        &self,
        sequence: &aa_canonical_str,
        mut ctx: Self::Ctx<'a>,
    ) -> impl Iterator<Item = Result<f64, Self::Err>> {
        self.enabled
            .then(|| 
                Ok(compute_scd(sequence, &mut ctx))
            )
            .into_iter()
    }
}

/// Function that computes sequence decoration for [`SCD::featurize`].
fn compute_scd(sequence: &aa_canonical_str, ctx: &mut Ctx2<'_>) -> f64 {
    const SIMPLIFIED_CHARGED_RESIDUES: [Aminoacid; 4] =
        [Aminoacid::D, Aminoacid::E, Aminoacid::K, Aminoacid::R];
    let num_charged_residues = SIMPLIFIED_CHARGED_RESIDUES
        .into_iter()
        .map(|aa| ctx.residue_counts[aa])
        .sum::<usize>();
    let mut simplified_charged_sites_and_charges =
        Vec::with_capacity_in(num_charged_residues, ctx.arena.get_memory());
    for (idx, aa) in sequence.into_iter().enumerate() {
        let charge = simplified_charge_of(aa);
        if charge == 0 {
            continue;
        }
        simplified_charged_sites_and_charges.push((idx, charge));
    }
    let mut scd_sum = 0.0;
    for i in 0..num_charged_residues {
        let (idx_i, charge_i) = simplified_charged_sites_and_charges[i];
        for j in 0..i {
            let (idx_j, charge_j) = simplified_charged_sites_and_charges[j];
            scd_sum += (charge_i * charge_j) as f64 * ((idx_i - idx_j) as f64).sqrt()
        }
    }
    scd_sum / sequence.len() as f64
}

/// Get the simplified charge of an aminoacid for computing SCD.
fn simplified_charge_of(aa: Aminoacid) -> i8 {
    match aa {
        Aminoacid::D | Aminoacid::E => -1,
        Aminoacid::K | Aminoacid::R => 1,
        _ => 0,
    }
}
