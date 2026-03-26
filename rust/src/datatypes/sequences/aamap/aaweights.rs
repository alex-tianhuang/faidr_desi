//! Module defining [`AAWeights`], a simple newtype wrapper.
use std::{mem, ops::Deref};
use crate::datatypes::AAMap;
use rand::seq::WeightError;

/// A map of numeric "weights" for each aminoacid.
///
/// This is just a newtype wrapper around an [`AAMap`]
/// of floats that are guaranteed to:
/// 1. Be non-negative, finite, and not NAN
/// 2. Not be all zero
/// 3. Have a finite sum
pub struct AAWeights(AAMap<f32>);
impl AAWeights {
    /// Make a new [`AAWeights`].
    ///
    /// This operation fails if:
    /// 1. Any of the weights are negative or NAN ([`WeightError::InvalidWeight`]).
    /// 2. The sum of the weights reaches infinity ([`WeightError::Overflow`]).
    /// 3. All the weights are zero ([`WeightError::InsufficientNonZero`]).
    pub fn new(weights: &AAMap<f32>) -> Result<&Self, WeightError> {
        let mut total_weight = 0.0;
        for weight in weights.values().copied() {
            if !(weight >= 0.0) {
                return Err(WeightError::InvalidWeight);
            }
            total_weight += weight;
            if total_weight.is_infinite() {
                return Err(WeightError::Overflow);
            }
        }
        if total_weight == 0.0 {
            return Err(WeightError::InsufficientNonZero);
        }
        // SAFETY: [`AAWeights`] is just a newtype wrapper around [`AAMap`].
        let this = unsafe { mem::transmute::<&AAMap<f32>, &Self>(weights) };
        Ok(this)
    }
}
impl Deref for AAWeights {
    type Target = AAMap<f32>;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
