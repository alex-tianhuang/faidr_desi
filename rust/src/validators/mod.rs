mod sequences;
pub use sequences::{
    AAStringParsingParameters, AAStringValidationParameters, CapitalizeMode, OmitMode,
};
pub(crate) use sequences::{AAStringParser, AAStringValidator};
