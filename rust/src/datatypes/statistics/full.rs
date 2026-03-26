use serde::{Deserialize, Serialize};
use std::ops::AddAssign;

use crate::datatypes::statistics::compact::CompactStatisticsVec;

/// A struct that accumulates the joint counts,
/// means, and correlations of multiple variables
/// which are not always defined on the sample.
///
/// This is the implementation of [`super::StandardStatisticsVec`]
/// when some variables can be undefined.
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct FullStatisticsVec {
    /// The number of variables that this struct is
    /// keeping track of.
    #[serde(skip_serializing)]
    n: usize,
    /// `n x n` symmetric matrix of joint counts.
    ///
    /// Joint counts are defined as the number of
    /// times when two variables were defined at the
    /// same time.
    counts: Vec<u32>,
    /// `n x n` size vector of joint sums of each variable.
    ///
    /// The slot corresponding to index `i x n + j`
    /// corresponds the sum of the `i`th variable whenever
    /// the `i`th and `j`th variable are simultaneously defined.
    sums: Vec<f64>,
    /// `n x n` size vector of joint sums of squares of each variable.
    ///
    /// The slot corresponding to index `i x n + j`
    /// corresponds the sum of the squared `i`th variable whenever
    /// the `i`th and `j`th variable are simultaneously defined.
    sums_squared: Vec<f64>,
    /// `n x n` symmetric matrix of sums of products
    /// of pairs of variables.
    sums_of_products: Vec<f64>,
}
impl FullStatisticsVec {
    /// The number of variables per row.
    ///
    /// Same as `n` from the constructor.
    pub fn len(&self) -> usize {
        self.n
    }
    /// Number of samples where variable `i` and
    /// variable `j` were simultaneously defined.
    pub fn joint_count_at(&self, i: usize, j: usize) -> u32 {
        self.counts[i * self.n + j]
    }
    /// Access the joint sum corresponding to
    /// the ordered pair of variables `i` and `j`.
    ///
    /// This is the sum of variable `i` whenever the
    /// variable `j` was simultaneously defined.
    pub fn joint_sum_at(&self, i: usize, j: usize) -> f64 {
        self.sums[i * self.n + j]
    }
    /// Access the joint sum of squared values corresponding
    /// to the ordered pair of variables `i` and `j`.
    ///
    /// This is the sum of variable `i` squared whenever the
    /// variable `j` was simultaneously defined.
    pub fn joint_sum_squared_at(&self, i: usize, j: usize) -> f64 {
        self.sums_squared[i * self.n + j]
    }
    /// Access the joint sum product corresponding
    /// to the ordered pair of variables `i` and `j`.
    ///
    /// This is the sum of variable `i` times
    /// variable `j` whenever both were defined.
    pub fn joint_sum_of_products_at(&self, i: usize, j: usize) -> f64 {
        self.sums_of_products[i * self.n + j]
    }
    /// Record a sample, which is represented by a "row" of
    /// multiple variables (an iterator of length `n`).
    pub fn record_row(&mut self, row: impl Clone + Iterator<Item = Option<f64>>) {
        let n = self.n;
        for (i, value_i) in row.clone().enumerate() {
            let Some(value_i) = value_i else { continue };
            let counts_row = &mut self.counts[i * n..(i + 1) * n];
            let sums_row = &mut self.sums[i * n..(i + 1) * n];
            let sums_squared_row = &mut self.sums_squared[i * n..(i + 1) * n];
            let sums_of_products_row = &mut self.sums_of_products[i * n..(i + 1) * n];
            for (j, value_j) in row.clone().enumerate() {
                let Some(value_j) = value_j else { continue };
                counts_row[j] += 1;
                sums_row[j] += value_i;
                sums_squared_row[j] += value_i * value_i;
                sums_of_products_row[j] += value_i * value_j;
            }
        }
    }
}
impl AddAssign<&Self> for FullStatisticsVec {
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
        impl_add_assign!(counts, sums, sums_squared, sums_of_products);
    }
}
impl AddAssign<&CompactStatisticsVec> for FullStatisticsVec {
    fn add_assign(&mut self, rhs: &CompactStatisticsVec) {
        debug_assert_eq!(self.len(), rhs.len());
        let n = self.len();
        for counts_slot in self.counts.iter_mut() {
            *counts_slot += rhs.count
        }
        for sums_row in self.sums.chunks_mut(n) {
            for (sums_slot, &rhs_sum) in sums_row.into_iter().zip(&rhs.sums) {
                *sums_slot += rhs_sum
            }
        }
        for sums_squared_row in self.sums_squared.chunks_mut(n) {
            for (i, sums_squared_slot) in sums_squared_row.into_iter().enumerate() {
                *sums_squared_slot += rhs.sums_of_products[i * (n + 1)];
            }
        }
        self.sums_of_products
            .iter_mut()
            .zip(&rhs.sums_of_products)
            .for_each(|(dest, src)| *dest += *src);
    }
}
impl From<CompactStatisticsVec> for FullStatisticsVec {
    fn from(value: CompactStatisticsVec) -> Self {
        let n = value.len();
        let counts = vec![value.count; n * n];
        let mut sums = Vec::with_capacity(n * n);
        let mut sums_squared = Vec::with_capacity(n * n);
        for _ in 0..n {
            sums.extend(value.sums.iter().cloned());
            sums_squared.extend((0..n).map(|i| value.sums_of_products[i * (n + 1)]));
        }
        Self {
            n,
            counts,
            sums,
            sums_squared,
            sums_of_products: value.sums_of_products,
        }
    }
}
