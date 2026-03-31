//! Module defining a basic sequence optimizer
//! for greedily fitting features.
use std::time::Duration;
use web_time::Instant;
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
#[derive(Copy, Clone, Serialize)]
pub struct PointMutation {
    pub from: Aminoacid,
    // 0-indexed.
    pub pos: usize,
    pub to: Aminoacid,
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
        current_mutation: PointMutation
    },
    /// A timeout was triggered.
    Timeout {
        current_mutation: PointMutation
    }
}
impl PointMutation {
    /// Get the next mutation, equivalent to two for loops:
    /// for pos in 0..sequence.len() {
    ///     for to in AMINOACIDS {
    ///         /* ... */
    ///     }
    /// }
    fn next_mutation(self, sequence: &aa_canonical_str) -> Option<Self> {
        let Self { from, pos, to } = self;
        if let Some(aaindex) = to.to_aaindex().step() {
            return Some(Self { from, pos, to: aaindex.to_aminoacid() })
        }
        let pos = pos + 1;
        let from = sequence.as_slice().get(pos).copied()?;
        let aa0 = AMINOACIDS[0];
        Some(Self { from, pos, to: aa0 })
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
        let aa0 =  AMINOACIDS[0];
        let mutation0 = PointMutation {
          from: sequence[0],
          pos: 0,
          to: if aa0 == sequence[0] {AMINOACIDS[1]} else {aa0}
        };
        let mut current_mutation = mutation0;
        let mut best_mutation = None;
        let iter = std::iter::from_fn(move || {
            let timer = Instant::now();
            'outer: loop {
                if timer.elapsed() > notification_interval { return Some(DesignProgress::Timeout { current_mutation })}
                sequence.as_mut()[current_mutation.pos] = current_mutation.to;
                if let Ok(candidate_norm) = seq_norm_of(&sequence) {
                    if candidate_norm < best_norm {
                        best_norm = candidate_norm;
                        best_mutation = Some(current_mutation);
                    }
                };
                sequence.as_mut()[current_mutation.pos] = current_mutation.from;
                while let Some(next_mutation) = current_mutation.next_mutation(&sequence) {
                    current_mutation = next_mutation;
                    if next_mutation.to != sequence[next_mutation.pos] {
                        continue 'outer
                    }
                }
                break 'outer
            }
            current_mutation = mutation0;
            let best_mutation = best_mutation?;
            sequence.as_mut()[best_mutation.pos] = best_mutation.to;
            Some(DesignProgress::CompletedIter { best_norm, best_mutation, current_mutation })
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