use crate::{AAStringValidationParameters, seq_features::featurize::FeatureContainerUserFacing};
pub use close_data::{ClosePayload, InitializationError};
use serde::Deserialize;
use std::collections::HashMap;
pub use yield_data::{DesignIteration, Initialized, Progress, YieldPayload};

/// Request payload for the `generate-ko` endpoint.
#[derive(Deserialize)]
pub struct RequestPayload {
    /// The sequence to start from.
    pub initial_sequence: String,
    /// Parameters for the validation of the sequences.
    pub sequence_validation_settings: AAStringValidationParameters,
    /// Features to compute.
    pub feature_configuration: FeatureContainerUserFacing,
    /// Target feature values for each feature.
    pub feature_targets: HashMap<String, f64>,
    /// Inverse standard deviations for each feature.
    pub feature_weights: HashMap<String, f64>,
}
mod yield_data {
    use crate::{datatypes::AACanonicalString, seq_generator::PointMutation};
    use serde::Serialize;
    /// Progress type returned at the `generate-ko` endpoint.
    #[derive(Serialize)]
    #[serde(tag = "case", rename_all = "kebab-case")]
    pub enum YieldPayload<'a> {
        /// Response yielded after sequence validation
        /// and featurizer compilation.
        Initialized(Initialized),
        /// Response yielded for the rest of the job.
        Progress(Progress<'a>),
    }
    /// Response yielded after sequence validation
    /// and featurizer compilation.
    #[derive(Serialize)]
    pub struct Initialized {
        pub feature_distance: f64,
    }
    /// Response containing data for a batch of design iterations.
    #[derive(Serialize)]
    pub struct Progress<'a> {
        pub iterations: &'a [DesignIteration],
    }
    /// Data associated to a single design iteration.
    #[derive(Serialize)]
    #[serde(rename_all = "camelCase")]
    pub struct DesignIteration {
        /// Mutation that best reduces the feature distance
        /// at this iteration.
        pub mutation: PointMutation,
        /// Sequence at this point.
        pub sequence: AACanonicalString,
        /// Feature distance to the target feature vector.
        pub feature_distance: f64,
    }
}
mod close_data {
    use crate::{adapters::PseudoMap, datatypes::StandardError};
    use serde::Serialize;

    /// Terminating response for the `generate-ko` endpoint.
    #[derive(Serialize)]
    #[serde(tag = "case", rename_all = "kebab-case")]
    pub enum ClosePayload<'a> {
        /// Sequence was designed successfully.
        Ok,
        /// Sequence validation or feature compilation failed.
        InitializationError(InitializationError<'a>),
    }
    /// Reason that a job could not be initialized.
    #[derive(Serialize)]
    #[serde(rename_all = "camelCase")]
    pub struct InitializationError<'a> {
        /// The main/overall reason the job failed.
        pub error: StandardError,
        /// Features that could not compiled (labelled by feature ID),
        /// along with the error that caused it.
        pub feature_compile_errors: PseudoMap<&'a str, StandardError>,
    }
}
