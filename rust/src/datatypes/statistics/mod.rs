use serde::{Deserialize, Serialize};
use std::{mem, ops::AddAssign};

use crate::datatypes::statistics::{compact::CompactStatisticsVec, full::FullStatisticsVec};
mod compact;
mod full;
/// A struct that accumulates the joint counts,
/// means, and correlations of multiple variables.
///
/// These variables are supposed to be associated to
/// every sample, and the collection of variables
/// associated to one given sample is called a "row".
///
/// To record a row of data, use [`StandardStatisticsVec::record_row`].
///
/// To merge the results of two or more subsampling processes,
/// use a `+=` expression:
/// ```
/// let n: usize = /* .. */;
/// let stats_a: StandardStatisticsVec = /* .. */;
/// let stats_b: StandardStatisticsVec = /* .. */;
/// let mut stats_master = StandardStatisticsVec::new(n);
/// stats_master += &stats_a;
/// stats_master += &stats_b;
/// ```
///
/// This is a merge of the compact representation
/// [`CompactStatisticsVec`] when all variables are
/// well defined, or the full representation
/// [`FullStatisticsVec`] when only some of the variables
/// are defined. It tries its best to stay compact
/// as long as all variables are defined.
#[derive(Deserialize, Serialize)]
pub struct StandardStatisticsVec(Impl);

/// Private enum that implements
/// methods for [`StandardStatisticsVec`].
#[derive(Deserialize, Serialize)]
#[serde(tag = "format", rename_all = "kebab-case")]
enum Impl {
    Compact(CompactStatisticsVec),
    Full(FullStatisticsVec),
}
impl StandardStatisticsVec {
    /// Make a new vector sampler of
    /// counts, means, and covariance.
    ///
    /// This new sampler computes `n` simultaneous
    /// counts, sums, and sums of products.
    pub fn new(n: usize) -> Self {
        Self(Impl::Compact(CompactStatisticsVec::new(n)))
    }
    /// The number of variables per row.
    ///
    /// Same as `n` from the constructor.
    pub fn len(&self) -> usize {
        match &self.0 {
            Impl::Compact(v) => v.len(),
            Impl::Full(v) => v.len(),
        }
    }
    /// Number of samples where variable `i` is defined.
    pub fn count_at(&self, i: usize) -> u32 {
        self.joint_count_at(i, i)
    }
    /// Number of samples where variable `i` and
    /// variable `j` were simultaneously defined.
    pub fn joint_count_at(&self, i: usize, j: usize) -> u32 {
        match &self.0 {
            Impl::Compact(v) => v.count(),
            Impl::Full(v) => v.joint_count_at(i, j),
        }
    }
    /// The sum of variable `i`.
    pub fn sum_at(&self, i: usize) -> f32 {
        self.joint_sum_at(i, i)
    }
    /// Access the joint sum corresponding to
    /// the ordered pair of variables `i` and `j`.
    ///
    /// This is the sum of variable `i` whenever the
    /// variable `j` was simultaneously defined.
    pub fn joint_sum_at(&self, i: usize, j: usize) -> f32 {
        match &self.0 {
            Impl::Compact(v) => v.sum_at(i),
            Impl::Full(v) => v.joint_sum_at(i, j),
        }
    }
    /// The sum of of variable `i` squared.
    pub fn sum_squared_at(&self, i: usize) -> f32 {
        self.joint_sum_of_products_at(i, i)
    }
    /// Access the joint sum of squared values corresponding
    /// to the ordered pair of variables `i` and `j`.
    ///
    /// This is the sum of variable `i` squared whenever the
    /// variable `j` was simultaneously defined.
    pub fn joint_sum_squared_at(&self, i: usize, j: usize) -> f32 {
        match &self.0 {
            Impl::Compact(v) => v.sum_of_products_at(i, i),
            Impl::Full(v) => v.joint_sum_squared_at(i, j),
        }
    }
    /// Access the joint sum product corresponding
    /// to the ordered pair of variables `i` and `j`.
    ///
    /// This is the sum of variable `i` times
    /// variable `j` whenever both were defined.
    pub fn joint_sum_of_products_at(&self, i: usize, j: usize) -> f32 {
        match &self.0 {
            Impl::Compact(v) => v.sum_of_products_at(i, j),
            Impl::Full(v) => v.joint_sum_of_products_at(i, j),
        }
    }
    /// Record a sample, which is represented by a "row" of
    /// multiple variables (an iterator of length `n`).
    pub fn record_row(&mut self, row: impl Clone + Iterator<Item = Option<f32>>) {
        match &mut self.0 {
            Impl::Compact(v) => {
                if row.clone().all(|opt| opt.is_some()) {
                    v.record_row(row.map(Option::unwrap));
                } else {
                    self.convert_inner_to_full().record_row(row);
                }
            }
            Impl::Full(v) => v.record_row(row),
        }
    }
    /// Reset all sample counts, sums, and sums of products to zero.
    pub fn clear(&mut self) {
        match &mut self.0 {
            Impl::Compact(v) => v.clear(),
            Impl::Full(v) => {
                self.0 = Impl::Compact(CompactStatisticsVec::new(v.len()))
            }
        }
    }
    /// If using a compact representation, switch to a full representation
    /// and then return the inner [`FullStatisticsVec`].
    fn convert_inner_to_full(&mut self) -> &mut FullStatisticsVec {
        match self {
            Self(Impl::Compact(v)) => {
                let v = mem::replace(v, CompactStatisticsVec::empty());
                self.0 = Impl::Full(FullStatisticsVec::from(v));
                let Impl::Full(v) = &mut self.0 else {
                    unreachable!()
                };
                v
            }
            Self(Impl::Full(v)) => {
                v
            }
        }
    }
}
impl AddAssign<&Self> for StandardStatisticsVec {
    fn add_assign(&mut self, rhs: &Self) {
        match &rhs.0 {
            Impl::Full(v) => {
                *self.convert_inner_to_full() += v;
            }
            Impl::Compact(v_rhs) => match &mut self.0 {
                Impl::Compact(v_lhs) => *v_lhs += v_rhs,
                Impl::Full(v_lhs) => *v_lhs += v_rhs,
            },
        }
    }
}
