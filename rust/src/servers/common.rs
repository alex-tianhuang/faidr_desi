use crate::{
    AAStringValidationParameters, AAStringValidator,
    adapters::{PseudoMap, serialize},
    datatypes::{
        AACanonicalString, StandardError, into_standard_error,
    },
    seq_features::featurize::{
        FeatureContainerUserFacing, Featurizer, FeaturizerCompilation, compile_features,
    },
};
use std::borrow::Cow;

/// Data returned by [`validate_sequences`].
///
/// (Specific to WASM/client-side, since it uses [`PseudoMap`]).
pub struct ValidatedSequences {
    /// Sequences that were validated unchanged.
    pub unmodified_sequences: Vec<(u32, AACanonicalString)>,
    /// Sequences (labelled by index) that were validated but
    /// needed to have characters capitalized or omitted.
    pub modified_sequences: PseudoMap<u32, AACanonicalString>,
    /// Errors for sequences (labelled by index) that could
    /// not pass validation.
    pub sequence_validation_errors: PseudoMap<u32, StandardError>,
}

/// Validates a list of strings with the given [`AAStringValidator`].
///
/// This is a (WASM/client-side) specific sequence validation function,
/// as it uses [`PseudoMap`].
pub fn validate_sequences(
    sequences: Vec<String>,
    validation_params: AAStringValidationParameters,
) -> Result<ValidatedSequences, StandardError> {
    let mut unmodified_sequences = Vec::with_capacity(sequences.len());
    let mut modified_sequences = PseudoMap::default();
    let mut sequence_validation_errors = PseudoMap::default();
    let validator = AAStringValidator::new(validation_params);
    for (idx, sequence) in sequences.into_iter().enumerate() {
        match validator.validate_cow(sequence.as_bytes()) {
            Ok(Cow::Borrowed(_)) => {
                // SAFETY:
                //
                // [`AAStringValidator::validate_cow`] guarantees that
                // a return of [`Cow::Borrowed`] means that the owner of the slice
                // can be cast using [`AACanonicalString::from_bytes_unchecked`].
                let sequence =
                    unsafe { AACanonicalString::from_bytes_unchecked(sequence.into_bytes()) };
                unmodified_sequences.push((idx as u32, sequence));
            }
            Ok(Cow::Owned(modified_sequence)) => {
                modified_sequences.push((idx as u32, modified_sequence))
            }
            Err(error) => sequence_validation_errors.push((idx as u32, into_standard_error(error))),
        }
    }
    let num_validated_sequences = unmodified_sequences.len() + modified_sequences.len();
    if num_validated_sequences == 0 {
        Err(StandardError::from_str("sequence failed to validate"))
    } else {
        Ok(ValidatedSequences {
            unmodified_sequences,
            modified_sequences,
            sequence_validation_errors,
        })
    }
}
/// Compiles a feature set and checks that it is not empty.
///
/// If the featurizer is empty, it returns only the compile errors.
pub fn compile_and_validate_features<'a>(
    feature_configuration: &'a FeatureContainerUserFacing,
) -> Result<FeaturizerCompilation<'a, Featurizer>, StandardError> {
    let compiled = compile_features::<Featurizer>(&feature_configuration);
    if !compiled.compile_errors.is_empty() {
        web_sys::console::error_2(&"failed to compile the following features".into(), &serialize(&compiled.compile_errors));
        Err(StandardError::from_str("featurizer failed to fully compile"))
    } else {
        Ok(compiled)
    }
}
/// Take two vectors of index-labelled sequences
/// and merge them (sorted) to a single vector.
///
/// As of Feb 11th, 2026, this function is only
/// used to merge modified and unmodified sequences.
pub fn merge_sequences(
    sequences_a: Vec<(u32, AACanonicalString)>,
    sequences_b: Vec<(u32, AACanonicalString)>,
) -> Vec<(u32, AACanonicalString)> {
    let mut merged_sequences = Vec::with_capacity(sequences_a.len() + sequences_b.len());
    let mut sequences_a = sequences_a.into_iter();
    let mut sequences_b = sequences_b.into_iter();
    let mut next_sequence_a = sequences_a.next();
    let mut next_sequence_b = sequences_b.next();
    while let (Some((idx_a, _)), Some((idx_b, _))) = (&next_sequence_a, &next_sequence_b) {
        if idx_a <= idx_b {
            merged_sequences.push(next_sequence_a.unwrap());
            next_sequence_a = sequences_a.next();
        } else {
            merged_sequences.push(next_sequence_b.unwrap());
            next_sequence_b = sequences_b.next();
        }
    }
    merged_sequences.extend(next_sequence_a);
    merged_sequences.extend(sequences_a);
    merged_sequences.extend(next_sequence_b);
    merged_sequences.extend(sequences_b);
    merged_sequences
}
