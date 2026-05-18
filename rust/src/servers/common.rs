use crate::{
    // AAStringValidationParameters, AAStringValidator,
    adapters::serialize,
    datatypes::StandardError,
    seq_features::featurize::{
        FeatureContainerUserFacing, Featurizer, FeaturizerCompilation, compile_features,
    },
};

/// Compiles a feature set and checks that it is not empty.
///
/// If the featurizer is empty, it returns only the compile errors.
pub fn compile_and_validate_features<'a>(
    feature_configuration: &'a FeatureContainerUserFacing,
) -> Result<FeaturizerCompilation<'a, Featurizer>, StandardError> {
    let compiled = compile_features::<Featurizer>(&feature_configuration);
    if !compiled.compile_errors.is_empty() {
        web_sys::console::error_2(
            &"failed to compile the following features".into(),
            &serialize(&compiled.compile_errors),
        );
        Err(StandardError::from_str(
            "featurizer failed to fully compile",
        ))
    } else {
        Ok(compiled)
    }
}
