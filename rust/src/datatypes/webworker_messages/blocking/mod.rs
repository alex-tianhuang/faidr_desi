//! Module defining [`RequestPayload`] and [`Endpoint`].
use serde::{Deserialize, Serialize};
use tsify::Tsify;
pub mod generate_ko;
pub mod generate_mimic;
pub mod featurize;

/// All possible blocking worker endpoints, plus the
/// necessary data to submit a request at each endpoint.
#[derive(Tsify, Deserialize, Serialize)]
#[serde(tag = "endpoint", rename_all = "kebab-case")]
pub enum RequestPayload {
    /// Private endpoint for computing sequence features of many sequences.
    Featurize(featurize::RequestPayload),
    /// Blocking endpoint for designing a single feature mimic.
    #[serde(skip_serializing)]
    GenerateMimic(generate_mimic::RequestPayload),
    /// Blocking endpoint for designing a single feature KO.
    // Technically allows for design to arbitrary feature vector
    // but in this project its for feature KOs.
    #[serde(skip_serializing)]
    GenerateKo(generate_ko::RequestPayload)
}