use std::time::Duration;

use crate::{
    adapters::SenderHandle, datatypes::webworker_messages::blocking::generate_ko::{
        ClosePayload, DesignIteration, Progress, RequestPayload, YieldPayload,
    }, seq_generator::DesignProgress, servers::blocking::generate_ko::init_job::{InitializedJob, init_job_generate_ko}
};
use wasm_bindgen::JsValue;

/// Shorthand for returning early on a [`std::ops::ControlFlow::Break`].
macro_rules! tri {
    ($x:expr) => {
        match $x.await? {
            std::ops::ControlFlow::Break(()) => return Ok(()),
            std::ops::ControlFlow::Continue(x) => x,
        }
    };
}

/// Generate a sequence fitting a feature vector,
/// in this project scope for generating feature KOs.
pub async fn generate_ko(request: RequestPayload, sender: SenderHandle) -> Result<(), JsValue> {
    let RequestPayload {
        initial_sequence,
        sequence_validation_settings,
        feature_configuration,
        feature_weights,
        feature_targets,
    } = request;
    let InitializedJob {
        mut sender,
        mut seq_generator,
        feature_weights,
        feature_origin,
        initial_sequence: mut sequence,
    } = tri!(init_job_generate_ko(
        initial_sequence,
        sequence_validation_settings,
        &feature_configuration,
        feature_weights,
        feature_targets,
        sender
    ));
    const NOTIFICATION_INTERVAL: Duration = Duration::from_millis(200);
    // Can't figure out how to return an &sequence from the iterator at the moment
    // so I'll just use a mirror of the `sequence`.
    for progress in seq_generator.design_iter(&sequence, &feature_origin, &feature_weights, NOTIFICATION_INTERVAL)
        .expect(
            "sequence feature validation of `initial_sequence` should have been validated in `init_job_generate_ko`",
        ) {
            match progress {
                DesignProgress::CompletedIter { best_norm, best_mutation } => {
                    sequence.as_mut()[best_mutation.pos] = best_mutation.to;
                    let msg = YieldPayload::Progress(Progress {
                        iterations: &[
                            DesignIteration {
                                mutation: best_mutation,
                                feature_distance: best_norm.sqrt(),
                                sequence: sequence.to_owned()
                            }
                        ],
                        current_mutation: None
                    });
                    sender = sender.send_data(&msg).await?;
                },
                DesignProgress::Timeout { current_mutation } => {
                    let msg = YieldPayload::Progress(Progress {
                        iterations: &[],
                        current_mutation: Some(current_mutation)
                    });
                    sender = sender.send_data(&msg).await?;
                }
            }
            
        }
    sender.send_close(&ClosePayload::Ok).await
}
mod init_job {
    use crate::{
        AAStringValidationParameters, AAStringValidator,
        adapters::{PseudoMap, SenderHandle},
        datatypes::{
            AACanonicalString, StandardError, into_standard_error,
            webworker_messages::blocking::{
                
                generate_ko::{ClosePayload, InitializationError, Initialized, YieldPayload},
            },
            webworker_messages::non_blocking::featurize
        },

        seq_features::featurize::{FeatureContainerUserFacing, Featurizer, FeaturizerCompilation},
        seq_generator::{SeqGenerator, euclidean_design_norm},
        servers::common::compile_and_validate_features,
    };
    use std::{collections::HashMap, ops::ControlFlow};
    use wasm_bindgen::JsValue;

    /// Data returned from an initialized job.
    pub struct InitializedJob {
        pub sender: SenderHandle,
        pub seq_generator: SeqGenerator,
        pub feature_weights: Vec<f64>,
        pub feature_origin: Vec<f64>,
        pub initial_sequence: AACanonicalString,
    }
    /// Get the feature vector of the target sequence,
    /// compile the featurizer,
    /// generate a starting sequence,
    /// and send that to frontend.
    pub async fn init_job_generate_ko(
        initial_sequence: String,
        sequence_validation_settings: AAStringValidationParameters,
        feature_configuration: &FeatureContainerUserFacing,
        feature_weights: HashMap<String, f64>,
        feature_targets: HashMap<String, f64>,
        sender: SenderHandle,
    ) -> Result<ControlFlow<(), InitializedJob>, JsValue> {
        let FeaturizerCompilation {
            mut featurizer,
            feat_order,
            compile_errors,
        } = match compile_and_validate_features(feature_configuration) {
            Ok(compiled) => compiled,
            Err(featurize::InitializationError {
                error,
                feature_compile_errors,
                ..
            }) => {
                let msg = ClosePayload::InitializationError(InitializationError {
                    error,
                    feature_compile_errors,
                });
                sender.send_close(&msg).await?;
                return Ok(ControlFlow::Break(()));
            }
        };
        let feature_weights =
            match convert_feature_map_to_vec(feature_weights, &feat_order, |feature_id| {
                format!("feature weight not found for feature {}", feature_id)
            }) {
                Ok(weights) => weights,
                Err(error) => {
                    let msg = ClosePayload::InitializationError(InitializationError {
                        error,
                        feature_compile_errors: PseudoMap::from(compile_errors),
                    });
                    sender.send_close(&msg).await?;
                    return Ok(ControlFlow::Break(()));
                }
            };
        let feature_origin =
            match convert_feature_map_to_vec(feature_targets, &feat_order, |feature_id| {
                format!("feature target not found for feature {}", feature_id)
            }) {
                Ok(origin) => origin,
                Err(error) => {
                    let msg = ClosePayload::InitializationError(InitializationError {
                        error,
                        feature_compile_errors: PseudoMap::from(compile_errors),
                    });
                    sender.send_close(&msg).await?;
                    return Ok(ControlFlow::Break(()));
                }
            };
        let (initial_norm, initial_sequence) = match validate_one_sequence(
            &initial_sequence,
            sequence_validation_settings,
            &mut featurizer,
            &feature_origin,
            &feature_weights,
        ) {
            Ok(data) => data,
            Err(error) => {
                let msg = ClosePayload::InitializationError(InitializationError {
                    error,
                    feature_compile_errors: PseudoMap::from(compile_errors),
                });
                sender.send_close(&msg).await?;
                return Ok(ControlFlow::Break(()));
            }
        };
        let seq_generator = SeqGenerator::new(featurizer);
        let msg = YieldPayload::Initialized(Initialized {
            feature_distance: initial_norm.sqrt(),
        });
        let sender = sender.send_data(&msg).await?;
        Ok(ControlFlow::Continue(InitializedJob {
            sender,
            seq_generator,
            feature_weights,
            feature_origin,
            initial_sequence,
        }))
    }
    /// Validate the sequence and then generate
    /// the initial feature space norm for the one given sequence.
    fn validate_one_sequence(
        sequence: &str,
        sequence_validation_settings: AAStringValidationParameters,
        featurizer: &mut Featurizer,
        origin: &[f64],
        weights: &[f64],
    ) -> Result<(f64, AACanonicalString), StandardError> {
        AAStringValidator::new(sequence_validation_settings)
            .validate_cow(sequence.as_bytes())
            .map_err(into_standard_error)
            .and_then(|seq| {
                if seq.len() != sequence.len() {
                    return Err(StandardError::from_str(
                        "only strict sequence validation on frontend is currently supported",
                    ));
                }
                let initial_norm = euclidean_design_norm(featurizer, &seq, origin, weights)?;
                Ok((initial_norm, seq.into_owned()))
            })
    }

    /// Helper function for [`init_job_generate_ko`].
    ///
    /// Turns a map of feature values to a vector using the given feature order.
    fn convert_feature_map_to_vec(
        map: HashMap<String, f64>,
        feat_order: &[&str],
        error: impl Fn(&str) -> String,
    ) -> Result<Vec<f64>, StandardError> {
        feat_order
            .iter()
            .map(|feature_id| {
                map.get(*feature_id)
                    .ok_or_else(|| StandardError::from_str(&error(*feature_id)))
                    .copied()
            })
            .collect::<Result<Vec<f64>, _>>()
    }
}
