//! Module defining a basic sequence optimizer
//! for greedily fitting features.
use serde::Serialize;
use crate::{
    datatypes::{AACanonicalString, AMINOACIDS, Aminoacid, StandardError, aa_canonical_str},
    seq_features::{featurize::Featurizer, functionality::featdim::FeatDim},
};

/// A simple, greedy feature optimizer.
pub struct SeqGenerator {
    featurizer: Featurizer,
}
/// A point mutation.
#[derive(Serialize)]
pub struct PointMutation {
    pub from: Aminoacid,
    // 0-indexed.
    pub pos: usize,
    pub to: Aminoacid,
}
impl SeqGenerator {
    pub fn new(featurizer: Featurizer) -> Self {
        Self { featurizer }
    }
    /// Iteratively minimize the euclidean norm of the given sequence
    /// in feature space towards the `origin`.
    /// 
    /// See also [`euclidean_design_norm`].
    pub(crate) fn design_iter<'a, 'b>(
        &'a mut self,
        sequence: &'b aa_canonical_str,
        origin: &'a [f64],
        weights: &'a [f64],
    ) -> Result<impl 'a + Iterator<Item = (f64, PointMutation)>, StandardError> {
        let Self { featurizer } = self;
        let featdim = featurizer.featdim();
        assert_eq!(
            featdim,
            origin.len(),
            "feature vector is of wrong dimension"
        );
        assert_eq!(
            featdim,
            weights.len(),
            "feature vector is of wrong dimension"
        );
        let mut sequence = AACanonicalString::new(sequence.as_slice().to_owned());
        let mut seq_norm_of = |sequence: &AACanonicalString| -> Result<f64, StandardError> {
            euclidean_design_norm(featurizer, &sequence, origin, weights)
        };
        let mut best_norm = seq_norm_of(&sequence)?;
        let iter = std::iter::from_fn(move || {
            let mut best_mutation = None;
            for i in 0..sequence.len() {
                let from_aa = sequence[i];
                for to_aa in AMINOACIDS {
                    if from_aa == to_aa {
                        continue;
                    };
                    sequence.as_mut()[i] = to_aa;
                    let Ok(candidate_norm) = seq_norm_of(&sequence) else {
                        continue;
                    };
                    if candidate_norm < best_norm {
                        best_norm = candidate_norm;
                        best_mutation = Some(PointMutation {
                            from: from_aa,
                            pos: i,
                            to: to_aa,
                        });
                    }
                }
                sequence.as_mut()[i] = from_aa;
            }
            let best_mutation = best_mutation?;
            sequence.as_mut()[best_mutation.pos] = best_mutation.to;
            Some((best_norm, best_mutation))
        });
        Ok(iter)
    }
}
/// Helper function for design code,
/// which computes the weighted squared difference
/// of sequence's feature vector from a given `origin`.
pub fn euclidean_design_norm(featurizer: &mut Featurizer, sequence: &aa_canonical_str, origin: &[f64], weights: &[f64]) 
-> Result<f64, StandardError> {
    let mut sum = 0.0;
    for (i, value) in featurizer.featurize(&sequence).enumerate() {
        let value = value?;
        let origin = origin[i];
        let weight = weights[i];
        let z_value = (value - origin) * weight;
        sum += z_value * z_value
    }
    Ok(sum)
}