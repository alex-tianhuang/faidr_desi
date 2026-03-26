use std::ops::AddAssign;

use serde::{Deserialize, Serialize};

/// A struct that accumulates the joint counts,
/// means, and correlations of multiple variables
/// that are always well defined on the sample.
///
/// This is the implementation of [`super::StandardStatisticsVec`]
/// when all variables exist on all samples given,
/// allowing the struct to store a much smaller amount
/// of information (since it doesn't have to keep track
/// of joint sums, counts, etc.).
#[derive(Deserialize, Serialize)]
pub(super) struct CompactStatisticsVec {
    /// The number of sample "row"s recorded.
    pub(super) count: u32,
    /// `n` size vector.
    /// 
    /// The sums of each variable across all rows.
    pub(super) sums: Vec<f32>,
    /// `n x n` symmetric matrix representing the sum of products
    /// of variables `i` and `j` at slot `i * n + j`.
    pub(super) sums_of_products: Vec<f32>
}
impl CompactStatisticsVec {
    /// Make a new vector sampler of
    /// counts, means, and covariance.
    ///
    /// This new sampler computes `n` simultaneous
    /// counts, sums, and sums of products.
    pub fn new(n: usize) -> Self {
        Self {
            count: 0,
            sums: vec![0.0; n],
            sums_of_products: vec![0.0; n * n],
        }
    }
    /// Make a placeholder of this type.
    /// 
    /// Used in [`super::StandardStatisticsVec::convert_inner_to_full`].
    pub const fn empty() -> Self {
        Self {
            count: 0,
            sums: Vec::new(),
            sums_of_products: Vec::new()
        }
    }
    /// The number of variables per row.
    ///
    /// Same as `n` from the constructor.
    pub fn len(&self) -> usize {
        self.sums.len()
    }
    /// Number of sample "row"s recorded.
    pub fn count(&self) -> u32 {
        self.count
    }
    /// The sum of variable `i`.
    pub fn sum_at(&self, i: usize) -> f32 {
        self.sums[i]
    }
    /// The sum of variable `i` times variable `j`.
    pub fn sum_of_products_at(&self, i: usize, j: usize) -> f32 {
        self.sums_of_products[i * self.len() + j]
    }
    /// Record a sample, which is represented by a "row" of
    /// multiple variables (an iterator of length `n`).
    pub fn record_row(&mut self, row: impl Clone + Iterator<Item = f32>) {
        let n = self.len();
        self.count += 1;
        for (i, value_i) in row.clone().enumerate() {
            self.sums[i] += value_i;
            let sums_of_products_row = &mut self.sums_of_products[i * n..(i + 1) * n];
            for (j, value_j) in row.clone().enumerate() {
                sums_of_products_row[j] += value_i * value_j;
            }
        }
    }
    /// Reset all sample counts, sums, and sums of products to zero.
    pub fn clear(&mut self) {
        self.count = 0;
        self.sums.iter_mut().for_each(|slot| *slot = 0.0);
        self.sums_of_products.iter_mut().for_each(|slot| *slot = 0.0);
    }
}
impl AddAssign<&Self> for CompactStatisticsVec {
    fn add_assign(&mut self, rhs: &Self) {
        debug_assert_eq!(self.len(), rhs.len());
        macro_rules! impl_add_assign {
            ($($field:ident),+) => {
                $(self.$field
                    .iter_mut()
                    .zip(rhs.$field.iter())
                    .for_each(|(dest, src)| *dest += *src);)+
            };
        }
        self.count += rhs.count;
        impl_add_assign!(sums, sums_of_products);
    }
}