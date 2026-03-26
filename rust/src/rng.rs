use std::ops::{Deref, DerefMut};

use rand::{SeedableRng, rngs::SmallRng};
use serde::{Deserialize, Serialize};

/// Parameters to deterministically
/// reconstruct an RNG.
#[derive(Deserialize, Serialize, PartialEq, Clone)]
pub struct RngSpec {
    pub seed: u32,
}
/// Opaque rng wrapper.
pub struct Rng {
    inner: SmallRng,
}
impl Rng {
    /// Make a new [`Rng`] from a [`RngSpec`].
    pub fn new(spec: &RngSpec) -> Self {
        Rng {
            inner: SmallRng::seed_from_u64(spec.seed as u64),
        }
    }
}
impl Deref for Rng {
    type Target = dyn rand::RngCore;
    fn deref(&self) -> &Self::Target {
        &self.inner
    }
}
impl DerefMut for Rng {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.inner
    }
}
