use serde_wasm_bindgen::from_value;
use wasm_bindgen::JsValue;
use wasm_bindgen_futures::future_to_promise;

use crate::{
    ResponsePayloadWithWorkerID, TaskSpawner,
    adapters::SenderHandle,
    datatypes::{Request, Response},
};

/// Forward the received request into the [`TaskSpawner`].
///
/// All responses from the given job are propagated
/// back to the [`SenderHandle`].
///
/// This function panics if the `request` does not have a `data` field.
/// Use [`crate::datatypes::webworker_messages::non_blocking::request_is_forwardable`] to validate this.
pub fn forward_request(
    request: JsValue,
    task_spawner: &TaskSpawner,
    sender: SenderHandle,
) -> impl Future<Output = Result<(), JsValue>> + 'static {
    let Request { data } = from_value(request).expect("expected request with `data` field");
    let request = Request { data: [data] };
    let task = task_spawner.spawn_batch_scoped(request, |recv| {
        future_to_promise(async move {
            let mut sender = sender;
            loop {
                match recv().await.map_err(|e| e.reject())? {
                    Response::Yield {
                        data: ResponsePayloadWithWorkerID { data, .. },
                    } => {
                        sender = sender.send_data(&data).await?;
                        continue;
                    }
                    Response::Close {
                        data: ResponsePayloadWithWorkerID { data, .. },
                    } => {
                        sender.send_close(&data).await?;
                        return Ok(JsValue::NULL);
                    }
                    Response::Error { reason } => {
                        sender.send_error(&reason).await?;
                        return Ok(JsValue::NULL);
                    }
                }
            }
        })
    });
    async { task.await.map_err(|e| e.reject()) }
}
