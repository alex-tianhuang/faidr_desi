use crate::{
    datatypes::sequences::AACanonicalStringStrict, rng::RngSpec, seq_features::featurize::FeatureContainerUserFacing
};
pub use close_data::ClosePayload;
use serde::Deserialize;
use std::collections::HashMap;
pub use yield_data::{DesignIteration, Initialized, Progress, YieldPayload};

/// Request payload for the `generate-mimic` endpoint.
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RequestPayload {
    /// The sequence to design a mimic for.
    pub target_sequence: AACanonicalStringStrict,
    /// Features to compute.
    pub feature_configuration: FeatureContainerUserFacing,
    /// Inverse standard deviations for each feature.
    pub feature_weights: HashMap<String, f64>,
    /// RNG spec for generating the initial random string of aminoacids.
    pub rng: RngSpec,
}
mod yield_data {
    use crate::{
        datatypes::{AACanonicalString, aa_canonical_str},
        seq_generator::PointMutation,
    };
    use serde::Serialize;
    /// Progress type returned at the `generate-mimic` endpoint.
    #[derive(Serialize)]
    #[serde(tag = "case", rename_all = "kebab-case")]
    pub enum YieldPayload<'a> {
        /// Response yielded after sequence validation
        /// and featurizer compilation.
        Initialized(Initialized<'a>),
        /// Response yielded for the rest of the job.
        Progress(Progress<'a>),
    }
    /// Response yielded after sequence validation
    /// and featurizer compilation.
    #[derive(Serialize)]
    #[serde(rename_all = "camelCase")]
    pub struct Initialized<'a> {
        pub feature_distance: f64,
        pub sequence: &'a aa_canonical_str,
    }
    /// Response containing data for a batch of design iterations.
    #[derive(Serialize)]
    #[serde(rename_all = "camelCase")]
    pub struct Progress<'a> {
        pub iterations: &'a [DesignIteration],
        // the latest mutation being worked on
        #[serde(skip_serializing_if = "Option::is_none")]
        pub current_mutation: Option<PointMutation>,
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
    use crate::datatypes::StandardError;
    use serde::Serialize;

    /// Terminating response for the `generate-mimic` endpoint.
    #[derive(Serialize)]
    #[serde(tag = "case", rename_all = "kebab-case")]
    pub enum ClosePayload {
        /// Sequence was designed successfully.
        Ok,
        /// Sequence validation or feature compilation failed.
        InitializationError(StandardError),
    }
}
