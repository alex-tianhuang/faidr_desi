use crate::{
    adapters::{PseudoMap, SenderHandle},
    datatypes::webworker_messages::{
        blocking::featurize::{ClosePayload, RequestPayload},
        common::featurize::Featurized,
    },
    seq_features::featurize::FeaturizerCompilation,
    servers::blocking::common::compile_and_validate_features,
};
use wasm_bindgen::JsValue;

/// Endpoint for computing sequence features of many sequences.
///
/// The user-facing contract is described in [`crate::datatypes::webworker_messages::non_blocking::featurize`].
pub async fn featurize(request: RequestPayload, sender: SenderHandle) -> Result<(), JsValue> {
    let FeaturizerCompilation {
        feat_order,
        mut featurizer,
        ..
    } = match compile_and_validate_features(&request.feature_configuration) {
        Ok(data) => data,
        Err(error) => {
            sender
                .send_close(&ClosePayload::InitializationError(error))
                .await?;
            return Ok(());
        }
    };
    let data = feat_order
        .iter()
        .copied()
        .zip(
            featurizer
                .featurize(&request.sequence)
                .map(Featurized::from),
        )
        .collect::<PseudoMap<_, _>>();
    sender.send_close(&ClosePayload::Ok { data }).await
}
