use thiserror::Error;

use crate::{
    datatypes::Aminoacid,
    seq_features::{
        contexts::common::ResidueCounts, functionality::featurize::FeaturizableSeqFeats,
        implementors::isoelectric_point::IsoelectricPoint,
    },
};

impl FeaturizableSeqFeats for IsoelectricPoint {
    type Ctx<'a> = &'a ResidueCounts;
    type Err = NoIsoelectricPoint;
    /// Part of the [`FeaturizableSeqFeats`] template.
    ///
    /// Computes the pH at which the sequence is expected to have net zero charge.
    /// (see [`compute_isoelectric_point`]).
    fn featurize<'a>(
        &self,
        _sequence: &crate::datatypes::aa_canonical_str,
        ctx: Self::Ctx<'a>,
    ) -> impl Iterator<Item = Result<f64, Self::Err>> {
        self.enabled
            .then(|| compute_isoelectric_point(&ctx))
            .into_iter()
    }
}
/// Helper for [`IsoelectricPoint::featurize`].
///
/// Computes the pH at which the sequence is expected to have net zero charge.
fn compute_isoelectric_point(residue_counts: &ResidueCounts) -> Result<f64, NoIsoelectricPoint> {
    const BASIC_RES: [Aminoacid; 3] = [Aminoacid::K, Aminoacid::R, Aminoacid::H];
    const PKAS_ALL: [(Aminoacid, f64); 7] = [
        (Aminoacid::K, 10.0),
        (Aminoacid::R, 12.0),
        (Aminoacid::H, 5.98),
        (Aminoacid::D, 4.05),
        (Aminoacid::E, 4.45),
        (Aminoacid::C, 9.0),
        (Aminoacid::Y, 10.0),
    ];
    let num_basic_res = 1 + BASIC_RES
        .into_iter()
        .map(|aa| residue_counts[aa])
        .sum::<usize>();
    let mut counts_and_pkas: [(f64, f64); PKAS_ALL.len()] = [(0.0, 0.0); PKAS_ALL.len()];
    for (idx, &(aa, pka)) in PKAS_ALL.iter().enumerate() {
        counts_and_pkas[idx] = (residue_counts[aa] as f64, pka)
    }
    bisect_search_isoelectric_point_legacy(|ph| {
        accurate_net_charge(ph, num_basic_res as f64, &counts_and_pkas)
    })
}
/// Helper for [`compute_isoelectric_point`].
///
/// Compute the (sort of) accurate net charge of a protein based on
/// the number of basic residues and the counts and pKas of charged residues.
///
/// Includes the N-terminal amino group and the C-terminal carboxy group.
fn accurate_net_charge(ph: f64, num_basic_res: f64, counts_and_pkas: &[(f64, f64); 7]) -> f64 {
    const PKA_N_TERM: f64 = 7.5;
    const PKA_C_TERM: f64 = 3.55;

    let mut free_protons: f64 = 0.0;

    for (count, pka) in counts_and_pkas {
        let proportion_protonated = 1.0 / (1.0 + 10.0_f64.powf(ph - pka));
        free_protons += *count * (1.0 - proportion_protonated);
    }

    let proportion_protonated_n_term = 1.0 / (1.0 + 10.0_f64.powf(ph - PKA_N_TERM));
    free_protons += 1.0 - proportion_protonated_n_term;

    let proportion_protonated_c_term = 1.0 / (1.0 + 10.0_f64.powf(ph - PKA_C_TERM));
    free_protons += 1.0 - proportion_protonated_c_term;

    num_basic_res - free_protons as f64
}
/// Search for the isoelectric point via bisection.
///
/// The `func` argument is a function from the pH to the charge,
/// which requires information about the amino-acid composition of the sequence.
fn bisect_search_isoelectric_point(func: impl Fn(f64) -> f64) -> Result<f64, NoIsoelectricPoint> {
    const CH_TOLERANCE: f64 = 1.0 / 10e_4;
    let mut max_ph: f64 = 14.0;
    let mut min_ph: f64 = 0.0;
    let mut guess_ph = 7.0;
    let mut charge = func(guess_ph);
    while charge.abs() > CH_TOLERANCE && (max_ph - min_ph).abs() > f64::EPSILON as f64 {
        if charge > 0.0 {
            min_ph = guess_ph;
        } else {
            max_ph = guess_ph;
        };
        guess_ph = (max_ph + min_ph) / 2.0;
        charge = func(guess_ph);
    }
    if charge.abs() > CH_TOLERANCE {
        Err(NoIsoelectricPoint)
    } else {
        Ok(guess_ph as f64)
    }
}

/// Search for the isoelectric point via bisection.
///
/// The `func` argument is a function from the pH to the charge,
/// which requires information about the amino-acid composition of the sequence.
/// 
/// Dev note
/// --------
/// This argument is meant to reproduce the isoelectric point
/// of some legacy code, because the better implementation above
/// does not necessarily agree with this one.
#[allow(unused)]
fn bisect_search_isoelectric_point_legacy(func: impl Fn(f64) -> f64) -> Result<f64, NoIsoelectricPoint> {
    const PH_TOLERANCE: f64 = 0.001;
    let mut guess_ph = 0.0;
    let mut min_ph = 0.0;
    while func(guess_ph) > 0.0 {
        min_ph = guess_ph;
        guess_ph += 1.0;
    }
    let mut max_ph = 1.0 + min_ph;
    while (max_ph - min_ph) > PH_TOLERANCE {
        guess_ph = (max_ph + min_ph) / 2.0;
        let charge = func(guess_ph);
        if charge > 0.0 {
            min_ph = guess_ph;
        } else {
            max_ph = guess_ph;
        }
    }
    Ok(guess_ph)
}
/// Returned if the isoelectric point calculation fails to converge.
///
/// This indicates the true isoelectric point is oustide the [0, 14] range,
/// which is very rare.
#[derive(Debug, Error)]
#[error("isoelectric point calculation failed to converge")]
pub struct NoIsoelectricPoint;
