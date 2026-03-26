use std::error::Error;
use serde::{Deserialize, Serialize};

/// Minimal error struct.
/// 
/// Currently supports basic serialization and deserialization.
#[derive(Debug, thiserror::Error)]
#[error("{reason}")]
pub struct StandardError {
    #[from]
    #[source]
    reason: Box<dyn Error + Send + Sync + 'static>
}
impl StandardError {
    /// Construct a standard error from a bare string.
    pub fn from_str(s: &str) -> Self {
        Self { reason: Box::from(s) }
    }
}
/// Quickest way to convert an error into a [`StandardError`].
pub fn into_standard_error(error: impl Error + Send + Sync + 'static) -> StandardError {
    StandardError { reason: Box::from(error) }
}
/// Helper struct for [`StandardError`]
/// serde implementations.
#[derive(Deserialize, Serialize)]
#[serde(rename = "StandardError")]
struct StandardErrorUserFacing {
    reason: String
}
impl<'de> Deserialize<'de> for StandardError {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
        where
            D: serde::Deserializer<'de> {
        let error = StandardErrorUserFacing::deserialize(deserializer)?;
        Ok(StandardError::from_str(&error.reason))
    }
}
impl Serialize for StandardError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
        where
            S: serde::Serializer {
        StandardErrorUserFacing { reason: self.to_string() }.serialize(serializer)
    }
}