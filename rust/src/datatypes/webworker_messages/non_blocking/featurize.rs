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
pub use close_data::ClosePayload;
use serde::Deserialize;
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
#[serde(rename_all = "camelCase")]
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
}
mod yield_data {
    use crate::{
        adapters::PseudoMap,
        datatypes::{
            AACanonicalString, StandardError, webworker_messages::common::featurize::Featurized,
        },
    };
    use serde::Serialize;

    /// Response type for the public `featurize` endpoint.
    #[derive(Serialize)]
    #[serde(tag = "phase", rename_all = "kebab-case")]
    pub enum YieldPayload<'a> {
        /// Response yielded after sequence validation
        /// and featurizer compilation.
        Initialized(&'a Initialized),
        /// Response yielded for the rest of the job.
        Progress(&'a Progress<'a>),
    }
    /// Sequence validation and feature compilation results.
    #[derive(Serialize)]
    #[serde(rename_all = "camelCase")]
    pub struct Initialized {
        /// Sequences which do not pass validation,
        /// and the error associated with it.
        pub sequence_validation_errors: PseudoMap<u32, StandardError>,
        /// Sequences that were modified (capitalized, trimmed, etc.)
        /// during validation.
        pub modified_sequences: PseudoMap<u32, AACanonicalString>,
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
    }
}

mod close_data {
    use serde::Serialize;

    use crate::datatypes::StandardError;

    /// Response type that terminates a job at the
    /// public `featurize` endpoint.
    #[derive(Serialize)]
    #[serde(tag = "case", rename_all = "kebab-case")]
    pub enum ClosePayload {
        /// Job completed.
        Ok,
        /// Job failed to initialize for some reason.
        InitializationError(StandardError),
    }
}