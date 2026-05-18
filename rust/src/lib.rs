mod adapters;
mod datatypes;
mod rng;
mod seq_features;
mod seq_generator;
mod servers;
mod utils;
pub use adapters::{Receiver, Sender, TaskSpawner};
pub use datatypes::{JSFacingAAMap, ResponsePayloadWithWorkerID};
pub use servers::{blocking_server, non_blocking_server};
pub use utils::{ParsedSequence, parse_text_as_sequence};

/// Turn a size-hint from a possibly untrusted source to a reasonable one.
///
/// Copied from `serde::core::de`.
fn cautious(hint: Option<usize>) -> usize {
    std::cmp::min(hint.unwrap_or(0), 4096)
}
