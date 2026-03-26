use wasm_bindgen::JsValue;
use wasm_bindgen_futures::future_to_promise;

use crate::{
    ResponsePayloadWithWorkerID, TaskSpawner,
    adapters::{JsValuePreserved, SenderHandle},
    datatypes::{Request, Response},
};

/// Forward the received request into the [`TaskSpawner`].
///
/// All responses from the given job are propagated
/// back to the [`SenderHandle`].
pub fn forward_request(
    request: JsValue,
    task_spawner: &TaskSpawner,
    sender: SenderHandle,
) -> impl Future<Output = Result<(), JsValue>> + 'static {
    let request = Request {
        data: [JsValuePreserved::new(request)],
    };
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
