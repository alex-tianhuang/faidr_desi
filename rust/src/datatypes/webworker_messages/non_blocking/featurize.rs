//! Endpoint for computing sequence features of many sequences.
//!
//! This endpoint takes a [`RequestPayload`].
//!
//! It first yields a [`YieldPayload::Initialized`], consisting of:
//! - sequences were not considered valid amino acid sequences / long enough
//! - sequences were modified to become different amino acid sequences
//! - features could not be compiled
//! If initialization fails, it will return a [`ClosePayload::InitializationError`].
//!
//! Then it yields a [`YieldPayload::Progress`], consisting of:
//! - sequence features for a batch of sequences (retrievable by index)
//! - statistics for sequence features across this job cumulatively
//! It returns unit (equivalent to nothing) on a successful finish.
pub use close_data::{ClosePayload, InitializationError};
use serde::Deserialize;
pub use statistics::StandardFeatureStatistics;
use tsify::Tsify;
pub use yield_data::{Initialized, Progress, YieldPayload};

use crate::{AAStringValidationParameters, seq_features::featurize::FeatureContainerUserFacing};

/// Data for the `featurize` endpoint.
///
/// See [module level docs] for endpoint behaviour.
///
/// [module level docs]: self
#[derive(Tsify, Deserialize)]
#[tsify(from_wasm_abi)]
pub struct RequestPayload {
    /// Sequences to featurize.
    ///
    /// It is assumed the caller sends sequences in a known order,
    /// so the resulting sequence features for each sequence will
    /// be returned associated to the index of the sequence in the
    /// input list.
    ///
    /// Here's what that looks like:
    /// ```
    /// {
    ///     "sequenceByFeatureMatrix": {
    ///         "0": {
    ///             // Features or errors for 1st sequence in list
    ///         },
    ///         "1": { 
    ///             // Features or errors for 2nd sequence in list
    ///         },
    ///         // ...
    ///     }
    /// }
    /// ```
    pub sequences: Vec<String>,
    /// Parameters for the validation of the sequences.
    pub sequence_validation_settings: AAStringValidationParameters,
    /// Features to compute.
    pub feature_configuration: FeatureContainerUserFacing,
    /// Whether or not to return feature statistics,
    /// if there are enough sequences for it.
    pub statistics_included: bool
}
mod yield_data {
    use crate::{
        adapters::PseudoMap,
        datatypes::{
            AACanonicalString, StandardError, webworker_messages::{
                common::featurize::Featurized, non_blocking::featurize::StandardFeatureStatistics,
            }
        },
    };
    use serde::Serialize;

    /// Response type for the public `featurize` endpoint.
    #[derive(Serialize)]
    #[serde(tag = "phase", rename_all = "kebab-case")]
    pub enum YieldPayload<'a> {
        /// Response yielded after sequence validation
        /// and featurizer compilation.
        Initialized(&'a Initialized<'a>),
        /// Response yielded for the rest of the job.
        Progress(&'a Progress<'a>),
    }
    /// Sequence validation and feature compilation results.
    #[derive(Serialize)]
    #[serde(rename_all = "camelCase")]
    pub struct Initialized<'a> {
        /// Sequences which do not pass validation,
        /// and the error associated with it.
        pub sequence_validation_errors: PseudoMap<u32, StandardError>,
        /// Sequences that were modified (capitalized, trimmed, etc.)
        /// during validation.
        pub modified_sequences: PseudoMap<u32, AACanonicalString>,
        /// Features which could not compile,
        /// and the error associated with it.
        pub feature_compile_errors: PseudoMap<&'a str, StandardError>,
        /// Whether or not statistics will be included in responses
        /// from this endpoint.
        pub statistics_included: bool,
    }
    /// Sequence features for a batch of features
    /// and cumulative statistics about all observed features.
    #[derive(Serialize)]
    #[serde(rename_all = "camelCase")]
    pub struct Progress<'a> {
        /// Sequence features for this batch of sequences.
        ///
        /// It is assumed the caller sends sequences in a known order,
        /// so the resulting sequence features for each sequence will
        /// be returned associated to the index of the sequence in the
        /// input list.
        ///
        /// Here's what that looks like:
        /// ```
        /// {
        ///     "sequenceByFeatureMatrix": {
        ///         "0": { /* Features or errors for 1st sequence in list */ },
        ///         "1": { /* Features or errors for 2nd sequence in list */ },
        ///         /* ... */
        ///     }
        /// }
        /// ```
        pub sequence_by_feature_matrix: PseudoMap<u32, PseudoMap<&'a str, Featurized>>,
        /// Counts, means, variances, and correlations of features.
        /// These results are cumulative.
        /// 
        /// Statistics are not included if there are too few sequences.
        /// That is indicated in the [`Initialized`] message.
        #[serde(skip_serializing_if = "Option::is_none")]
        pub feature_statistics: Option<StandardFeatureStatistics<'a>>,
    }
}

mod close_data {
    use crate::{adapters::PseudoMap, datatypes::StandardError};
    use serde::Serialize;

    /// Response type that terminates a job at the
    /// public `featurize` endpoint.
    #[derive(Serialize)]
    #[serde(tag = "case", rename_all = "kebab-case")]
    pub enum ClosePayload<'a> {
        /// Job completed.
        Ok,
        /// Job failed to initialize for some reason.
        InitializationError(InitializationError<'a>),
    }
    /// Reason that a job could not be initialized.
    #[derive(Serialize)]
    #[serde(rename_all = "camelCase")]
    pub struct InitializationError<'a> {
        /// The main/overall reason the job failed.
        pub error: StandardError,
        /// Sequences that could not be validated (labelled by index),
        /// along with the error that caused it.
        pub sequence_validation_errors: PseudoMap<u32, StandardError>,
        /// Features that could not compiled (labelled by feature ID),
        /// along with the error that caused it.
        pub feature_compile_errors: PseudoMap<&'a str, StandardError>,
    }
}
mod statistics {
    //! Submodule for defining [`StandardFeatureStatistics`].
    use crate::{
        adapters::PseudoMap,
        datatypes::StandardStatisticsVec,
        statistics::{mean_and_sample_std, pearson_correlation},
    };
    use serde::Serialize;

    /// Serializable summary of the counts, means,
    /// and variance/correlations of a given set of features.
    ///
    /// The strings in this schema refer to feature IDs.
    ///
    /// The lifecycle of this object is to be initialized with
    /// a slice of feature IDs, then populated with index-labelled
    /// statistical data (via [`StandardStatisticsVec`]), then
    /// serialized.
    #[derive(Serialize)]
    #[serde(rename_all = "camelCase")]
    pub struct StandardFeatureStatistics<'a> {
        /// Information about the counts and joint counts
        /// (when two feature values are well defined for one sequence)
        /// of features.
        counts: PseudoMap<&'a str, FeatureCounts<'a>>,
        /// The average value of each feature (by feature ID).
        averages: PseudoMap<&'a str, f64>,
        /// Information about the variance and correlation
        /// of different features.
        covariance_data: PseudoMap<&'a str, FeatureCovariances<'a>>,
    }
    /// Count and joint counts for one feature.
    #[derive(Serialize)]
    #[serde(rename_all = "camelCase")]
    pub struct FeatureCounts<'a> {
        /// Number of times the feature was recorded.
        count: u32,
        /// Number of times the feature was recorded
        /// alongside another (by the feature ID of
        /// the other feature).
        joint_counts: PseudoMap<&'a str, u32>,
    }
    /// Variance and correlations for one feature.
    #[derive(Serialize)]
    #[serde(rename_all = "camelCase")]
    pub struct FeatureCovariances<'a> {
        /// Square root of the variance of the feature.
        standard_deviation: f64,
        /// Correlation value of the feature with
        /// another feature (by the feature ID of
        /// the other feature)
        correlations: PseudoMap<&'a str, f64>,
    }
    impl<'a> StandardFeatureStatistics<'a> {
        /// Create a new [`StandardFeatureStatistics`]
        /// that assumes the given order of feature IDs.
        pub fn new(feature_ids: impl Clone + ExactSizeIterator<Item = &'a str>) -> Self {
            let counts = PseudoMap::from_iter(feature_ids.clone().into_iter().enumerate().map(
                |(i, feature_id)| {
                    let mut joint_counts = PseudoMap::with_capacity(feature_ids.len() - 1);
                    joint_counts.extend(
                        feature_ids
                            .clone()
                            .into_iter()
                            .enumerate()
                            .filter(|(j, _)| i != *j)
                            .map(|(_, other_feature_id)| (other_feature_id, 0)),
                    );
                    (
                        feature_id,
                        FeatureCounts {
                            count: 0,
                            joint_counts,
                        },
                    )
                },
            ));
            let averages = PseudoMap::from_iter(
                feature_ids
                    .clone()
                    .into_iter()
                    .map(|feature_id| (feature_id, f64::NAN)),
            );
            let covariance_data =
                PseudoMap::from_iter(feature_ids.clone().into_iter().enumerate().map(
                    |(i, feature_id)| {
                        let mut correlations = PseudoMap::with_capacity(feature_ids.len() - 1);
                        correlations.extend(
                            feature_ids
                                .clone()
                                .into_iter()
                                .enumerate()
                                .filter(|(j, _)| i != *j)
                                .map(|(_, other_feature_id)| (other_feature_id, f64::NAN)),
                        );
                        (
                            feature_id,
                            FeatureCovariances {
                                standard_deviation: f64::NAN,
                                correlations,
                            },
                        )
                    },
                ));
            Self {
                counts,
                averages,
                covariance_data,
            }
        }
        /// Take index-labelled statistics from [`StandardStatisticsVec`]
        /// and compute the appropriate feature ID labelled quantities.
        ///
        /// Typically after this you serialize the results somehow.
        pub fn compute(&mut self, data: &StandardStatisticsVec) {
            debug_assert_eq!(self.counts.len(), data.len());
            let n = self.counts.len();
            for i in 0..n {
                let count_i = data.count_at(i);
                let (mean_i, std_i) =
                    mean_and_sample_std(count_i, data.sum_at(i), data.sum_squared_at(i));
                self.counts[i].1.count = count_i;
                self.averages[i].1 = mean_i;
                self.covariance_data[i].1.standard_deviation = std_i;
                let joint_counts = &mut **self.counts[i].1.joint_counts;
                let correlations = &mut **self.covariance_data[i].1.correlations;
                for j in 0..n {
                    if i == j {
                        continue;
                    };
                    let joint_count = data.joint_count_at(i, j);
                    let j2 = j - (i < j) as usize;
                    joint_counts[j2].1 = joint_count;
                    correlations[j2].1 = pearson_correlation(
                        joint_count,
                        data.joint_sum_at(i, j),
                        data.joint_sum_at(j, i),
                        data.joint_sum_of_products_at(i, j),
                        data.joint_sum_squared_at(i, j),
                        data.joint_sum_squared_at(j, i),
                    );
                }
            }
        }
    }
}
