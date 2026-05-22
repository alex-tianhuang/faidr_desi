//! Module defining a basic sequence optimizer
//! for greedily fitting features.
use std::time::Duration;
use web_time::Instant;
use serde::Serialize;
use crate::{
    datatypes::{AACanonicalString, AAIndex, Aminoacid, StandardError, aa_canonical_str},
    seq_features::{featurize::Featurizer, functionality::featdim::FeatDim},
};

/// A simple, greedy feature optimizer.
pub struct SeqGenerator {
    featurizer: Featurizer,
}
/// A point mutation.
#[derive(Copy, Clone, Serialize, Debug)]
pub struct PointMutation {
    pub from: Aminoacid,
    // 0-indexed.
    pub pos: usize,
    pub to: Aminoacid,
}
/// Iterator over all point mutations bounded by a given length.
pub struct PointMutationGenerator {
    pub bound: usize,
    pub pos: usize,
    pub to: AAIndex
}
/// A notification from [`SeqGenerator::design_iter`].
/// 
/// Used to be one iteration, but now using timeouts
/// to ensure workers do not hang too long.
pub enum DesignProgress {
    /// A design iteration was completed.
    CompletedIter {
        best_norm: f64,
        best_mutation: PointMutation,
    },
    /// A timeout was triggered.
    Timeout {
        current_mutation: PointMutation
    }
}
impl PointMutationGenerator {
    pub fn new(seq_len: usize) -> Self {
        Self { bound: seq_len, pos: 0, to: AAIndex::MIN }
    }
    pub fn reset(&mut self) {
        self.pos = 0;
        self.to = AAIndex::MIN;
    }
}
impl Iterator for PointMutationGenerator {
    type Item = (usize, Aminoacid);
    fn next(&mut self) -> Option<Self::Item> {
        let Self { bound, pos, to } = self;
        if pos == bound {return None};
        let next_to = *to;
        let next_pos= *pos;
        *to = next_to.step().unwrap_or_else(|| {
            *pos += 1;
            AAIndex::MIN
        });
        Some((next_pos, next_to.to_aminoacid()))
    }
}
impl SeqGenerator {
    pub fn new(featurizer: Featurizer) -> Self {
        Self { featurizer }
    }
    /// Iteratively minimize the euclidean norm of the given sequence
    /// in feature space towards the `origin`.
    /// 
    /// Panics if the feature vectors are the wrong dimension
    /// or if the sequence is empty.
    /// 
    /// See also [`euclidean_design_norm`].
    pub(crate) fn design_iter<'a, 'b>(
        &'a mut self,
        sequence: &'b aa_canonical_str,
        origin: &'a [f64],
        weights: &'a [f64],
        notification_interval: Duration,
    ) -> Result<impl 'a + Iterator<Item = DesignProgress>, StandardError> {
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
        assert!(!sequence.as_slice().is_empty(), "sequence filtering should be done before this function");
        let mut sequence = AACanonicalString::new(sequence.as_slice().to_owned());
        let mut seq_norm_of = |sequence: &AACanonicalString| -> Result<f64, StandardError> {
            euclidean_design_norm(featurizer, &sequence, origin, weights)
        };
        let mut best_norm = seq_norm_of(&sequence)?;
        let mut mutation_generator = PointMutationGenerator::new(sequence.len());
        let mut best_mutation = None;
        let mut timer = Instant::now();
        let iter = std::iter::from_fn(move || {
            
            for (pos, to) in mutation_generator.by_ref() {
                let from = sequence[pos];
                let current_mutation = PointMutation {
                    from,
                    pos,
                    to
                };
                if sequence[pos] != to {
                    sequence.as_mut()[pos] = to;
                    if let Ok(candidate_norm) = seq_norm_of(&sequence) {
                        if candidate_norm < best_norm {
                            best_norm = candidate_norm;
                            best_mutation = Some(current_mutation);
                        }
                    };
                    sequence.as_mut()[pos] = from;
                }
                if timer.elapsed() > notification_interval { 
                    timer = Instant::now();
                    return Some(DesignProgress::Timeout { current_mutation })
                };
            }
            let best_mutation = best_mutation.take()?;
            mutation_generator.reset();
            sequence.as_mut()[best_mutation.pos] = best_mutation.to;
            Some(DesignProgress::CompletedIter { best_norm, best_mutation })
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