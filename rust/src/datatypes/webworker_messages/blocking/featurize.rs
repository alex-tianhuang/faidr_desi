pub use close_data::ClosePayload;
use serde::{Deserialize, Serialize};
use tsify::Tsify;
use crate::{datatypes::sequences::AACanonicalStringStrict, seq_features::featurize::FeatureContainerUserFacing};

/// Data for the `featurize` endpoint.
///
/// See [module level docs] for endpoint behaviour.
///
/// [module level docs]: self
#[derive(Tsify, Deserialize, Serialize)]
#[tsify(from_wasm_abi)]
#[serde(rename_all = "camelCase")]
pub struct RequestPayload {
    /// Sequence to featurize.
    pub sequence: AACanonicalStringStrict,
    /// Features to compute.
    pub feature_configuration: FeatureContainerUserFacing,
}
mod close_data {
    use serde::Serialize;

    use crate::{adapters::PseudoMap, datatypes::{StandardError, webworker_messages::common::featurize::Featurized}};

    /// Response type that terminates a job at the
    /// public `featurize` endpoint.
    #[derive(Serialize)]
    #[serde(tag = "case", rename_all = "kebab-case")]
    pub enum ClosePayload<'a> {
        /// Job completed.
        Ok {
            data: PseudoMap<&'a str, Featurized>
        },
        /// Job failed to initialize for some reason.
        InitializationError(StandardError),
    }
}