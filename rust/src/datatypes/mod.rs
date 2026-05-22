//! Module of datatypes and with very simple methods on them.
pub(crate) mod sequences;
mod standard_error;
pub(crate) mod webworker_messages;
pub(crate) use sequences::{AACanonicalString, AAIndex, AMINOACIDS, Aminoacid, aa_canonical_str};
pub use sequences::{AAMap, AASet, JSFacingAAMap};
pub use standard_error::{StandardError, into_standard_error};
pub use webworker_messages::{Request, Response, ResponsePayloadWithWorkerID};
