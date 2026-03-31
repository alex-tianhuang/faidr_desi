use super::is_hup_error;
use crate::{
    Receiver, Sender,
    datatypes::{
        Request,
        webworker_messages::{blocking::RequestPayload, get_connection_id},
    },
};
use serde_wasm_bindgen::from_value;
use wasm_bindgen::{JsValue, prelude::wasm_bindgen};
mod webworker_featurize;
mod generate_ko;
mod generate_mimic;

/// Shorthand for taking a future with output type `Result<(), JsValue>`
/// and turning that into a future with unit output type.
///
/// At the moment just logs it.
///
/// Dev note
/// --------
/// I've tried to keep the type of error logged here to be one
/// where something has fatally gone wrong. This is not for user
/// error (no features or sequences, etc.) which is expected but
/// rather developer error, where a piece of the communication system
/// is broken and it's my fault.
macro_rules! new_task {
    ($task:expr) => {{
        match $task.await {
            Ok(()) => (),
            Err(err) => {
                if !is_hup_error(&err) {
                    web_sys::console::error_1(&err);
                }
            }
        }
    }};
}
/// A function exposed to JS that runs the blocking
/// or "private" endpoints of the server.
///
/// This part of the server is responsible for doing blocking
/// work. Most of its endpoints do not have "nice" or stable
/// APIs. Some endpoints, which are "forwarded" by the non-blocking
/// server, will have "nice" and stable APIs.
///
/// The function takes:
/// 1. An async function that resolves on the next message to the server.
///    (see [`Receiver`] docs).
/// 2. An async function that takes a message and resolves after it is sent to the frontend.
///    Preferably this function should reject the promise in JS if the connection is closed.
///    (see [`Sender`] docs).
///
/// It crashes for reasons in the [`Receiver`] or [`Sender`] docs,
/// or if it fails to deserialize a connection ID from an received message.
#[wasm_bindgen(js_name = "blockingServer")]
pub async fn blocking_server(receiver: Receiver, sender: Sender) -> Result<JsValue, JsValue> {
    loop {
        let received = receiver.recv().await?;
        let sender = match get_connection_id(received.clone()) {
            Ok(conn_id) => sender.handle(conn_id),
            Err(_) => {
                return Err(format!(
                    "[blockingServer] received a message without any connection ID: {:?}",
                    received
                )
                .into());
            }
        };
        let request = match from_value::<Request<RequestPayload>>(received) {
            Ok(request) => request,
            Err(err) => {
                new_task!(sender.send_error(&format!(
                    "[nonBlockingServer] failed to deserialize request ({})",
                    err
                )));
                continue;
            }
        };
        match request.data {
            RequestPayload::WebworkerFeaturize(request) => {
                new_task!(webworker_featurize::webworker_featurize(request, sender))
            }
            RequestPayload::GenerateMimic(request) => {
                new_task!(generate_mimic::generate_mimic(request, sender))
            },
            RequestPayload::GenerateKo(request) => {
                new_task!(generate_ko::generate_ko(request, sender))
            }
        }
    }
}
