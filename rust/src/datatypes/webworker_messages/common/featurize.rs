use serde::{Deserialize, Serialize};
use crate::datatypes::StandardError;

/// A single feature result for a single sequence.
#[derive(Deserialize, Serialize)]
#[serde(tag = "case")]
pub enum Featurized {
    Ok { value: f64 },
    /// Error coming from featurization
    /// of a single sequence.
    Error { value: StandardError },
}
impl Featurized {
    /// Get the feature value if it was successfully computed.
    pub fn ok(&self) -> Option<f64> {
        match *self {
            Self::Ok { value } => Some(value),
            Self::Error { .. } => None
        }
    }
}
impl From<Result<f64, StandardError>> for Featurized {
    fn from(value: Result<f64, StandardError>) -> Self {
        match value {
            Ok(value) => Self::Ok {value},
            Err(err) => Self::Error { value: err }
        }
    }
}