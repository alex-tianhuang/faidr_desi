mod adapters;
mod batching;
mod datatypes;
mod rng;
mod seq_features;
mod seq_generator;
mod servers;
mod statistics;
mod utils;
mod validators;
pub use adapters::{Receiver, Sender, TaskSpawner};
pub use datatypes::{Graphic, JSFacingAAMap, ResponsePayloadWithWorkerID};
pub use servers::{blocking_server, non_blocking_server};
pub(crate) use validators::{AAStringParser, AAStringValidator};
pub use validators::{
    AAStringParsingParameters, AAStringValidationParameters, CapitalizeMode, OmitMode,
};
pub use utils::{parse_first_sequence_of_fasta, parse_text_as_sequence};

/// Turn a size-hint from a possibly untrusted source to a reasonable one.
///
/// Copied from `serde::core::de`.
fn cautious(hint: Option<usize>) -> usize {
    std::cmp::min(hint.unwrap_or(0), 4096)
}
