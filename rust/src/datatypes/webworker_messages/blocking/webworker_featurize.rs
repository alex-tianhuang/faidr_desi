//! Endpoint for computing sequence features of many sequences.
//! 
//! This endpoint is not meant to be user-facing (in a native
//! environment, this wouldn't be a different endpoint but rather
//! this would probably be a function run on a different thread).
//! 
//! I thus optimized a bunch of stuff that makes it faster to
//! serialize/deserialize but harder for users to understand.
//! There are a number of odd design quirks that should
//! be discussed lest they cause confusion or become footguns:
//! 
//! 1. The sequences is expected to have been validated
//!    already and are definitely capitalized aminoacids
//!    (see [`AAStringStrict`]).
//! 
//!    Failure to uphold this assumption will result
//!    in an opaque deserialization error.
//! 
//! 2. The returned data corresponding to each sequence
//!    will arrive in the same order the sequences were
//!    submitted, and otherwise have no identifiers
//!    corresponding to the original sequences.
//! 
//! 3. The feature set has been compiled already, and
//!    therefore the final result of the compilation
//!    and the order that features will be in are known
//!    by the caller.
//! 
//!    This endpoint will, knowing that, not return any
//!    information about the feature order or the errors
//!    arising from the compilation of those features.
//! 
//!    The features that are returned will be a list
//!    of features/errors that are grouped into
//!    results corresponding to each sequence.
//!    (so in a featurizer of featdim `F`, the first
//!    `F` objects in the return schema are
//!    features/errors for the first sequence).
use crate::{adapters::JsValuePreserved, datatypes::{AACanonicalString, StandardStatisticsVec, sequences::AACanonicalStringStrict, webworker_messages::common::featurize::Featurized}, seq_features::featurize::FeatureContainerUserFacing};
use serde::{Deserialize, Serialize};

/// Request type for `webworker-featurize` endpoint.
/// 
/// Has two different variants because serialization
/// only requires borrowed data and can point to the same
/// object multiple times, whereas deserialization requires
/// ownership (because I deserialize from `JsValue`) and
/// full destructuring of the value.
#[derive(Deserialize, Serialize)]
#[serde(untagged)]
pub enum RequestPayload {
    #[serde(rename_all = "camelCase", skip_serializing)]
    Deserialize {
        /// A parameter to control the yielding rate of progress.
        /// 
        /// Currently describes the number of sequences per batch.
        batch_size: u32,
        /// Validated sequences to featurize.
        sequences: Vec<AACanonicalStringStrict>,
        /// Features to compute.
        feature_configuration: FeatureContainerUserFacing,
        /// Whether or not to return feature statistics.
        statistics_included: bool
    },
    #[serde(rename_all = "camelCase", skip_deserializing)]
    Serialize {
        /// A parameter to control the yielding rate of progress.
        /// 
        /// Currently describes the number of sequences per batch.
        batch_size: u32,
        /// Validated sequences to featurize.
        sequences: Vec<AACanonicalString>,
        /// Features to compute.
        /// 
        /// This field differs from the [`RequestPayload::Deserialize`]
        /// variant. The idea is that, since the sequences are changing
        /// but the features typically remain the same, you can serialize
        /// the featurizer once and then reuse the `JsValue` to avoid
        /// duplicate work.
        #[serde(rename = "featureConfiguration")]
        feature_configuration_preserialized: JsValuePreserved,
        /// Whether or not to return feature statistics.
        statistics_included: bool
    }
}
/// Response type (progressive) for the private
/// `webworker-featurize` endpoint.
///
/// Since this endpoint is not meant to be user-facing,
/// there are a number of assumptions that I make that
/// make this type hard to understand at first glance.
/// For that discussion, see the docs on
/// [`super::RequestPayload::WebworkerFeaturize`].
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct YieldPayload {
    /// Contiguous "rows" correspond to
    /// features for each sequence.
    ///
    /// Rows come in order that the
    /// sequences were submitted.
    pub sequence_by_feature_matrix: Vec<Featurized>,
    /// The mean and covariance statistics associated
    /// with this batch of sequences' features.
    /// 
    /// This field will not be returned if
    /// `statisticsIncluded=False` in the [`RequestPayload`].
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub feature_statistics: Option<StandardStatisticsVec>,
}
