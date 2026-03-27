mod adapters;
mod batching;
mod datatypes;
mod deserializer;
mod rng;
mod seq_generator;
mod seq_features;
mod servers;
mod statistics;
mod validators;
pub use adapters::{Receiver, Sender, TaskSpawner};
pub use datatypes::{Graphic, JSFacingAAMap, ResponsePayloadWithWorkerID};
pub use servers::{blocking_server, non_blocking_server};
pub(crate) use validators::{AAStringParser, AAStringValidator};
pub use validators::{
    AAStringParsingParameters, AAStringValidationParameters, CapitalizeMode, OmitMode,
};

/// Turn a size-hint from a possibly untrusted source to a reasonable one.
/// 
/// Copied from `serde::core::de`.
fn cautious(hint: Option<usize>) -> usize {
    std::cmp::min(hint.unwrap_or(0), 4096)
}
