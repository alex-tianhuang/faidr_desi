use crate::{
    Receiver, Sender, TaskSpawner,
    datatypes::{
        webworker_messages::{
            get_connection_id,
            non_blocking::{RequestPayload, request_is_forwardable},
        },
    },
};
use serde_wasm_bindgen::from_value;
use wasm_bindgen::{JsValue, prelude::wasm_bindgen};
mod common;
mod featurize;
mod forward;
mod generate_mimic;

/// Shorthand for taking a future with output type `Result<(), JsValue>`
/// and turning that into a future with unit output type for
/// [`wasm_bindgen_futures::spawn_local`].
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
        let task = $task;
        wasm_bindgen_futures::spawn_local(async {
            match task.await {
                Ok(()) => (),
                Err(err) => {
                    web_sys::console::error_1(&err);
                }
            }
        })
    }};
}
/// A function exposed to JS that runs the non-blocking
/// or "public" endpoints of the server.
///
/// This part of the server is responsible for scheduling
/// subworkers to do computations and communicating with the
/// frontend, and is expected to have a "vaguely user friendly"
/// API.
///
/// The function takes:
/// 1. An async function that resolves on the next message to the server.
///    (see [`Receiver`] docs).
/// 2. An async function that takes a message and resolves after it is sent to the frontend.
///    Preferably this function should reject the promise in JS if the connection is closed.
///    (see [`Sender`] docs).
/// 3. An async function that communicates with workers (see [`TaskSpawner`] docs).
/// 
/// It crashes for reasons in the [`Receiver`], [`Sender`], or [`TaskSpawner`] docs,
/// or if it fails to deserialize a connection ID from an received message.
#[wasm_bindgen(js_name = "nonBlockingServer")]
pub async fn non_blocking_server(
    receiver: Receiver,
    sender: Sender,
    task_spawner: TaskSpawner,
) -> Result<JsValue, JsValue> {
    loop {
        let received = receiver.recv().await?;
        let sender = match get_connection_id(received.clone()) {
            Ok(conn_id) => sender.handle(conn_id),
            Err(_) => return Err(format!("[nonBlockingServer] received a message without any connection ID: {:?}", received).into()),
        };
        if request_is_forwardable(received.clone()) {
            new_task!(forward::forward_request(received, &task_spawner, sender));
            continue;
        }
        let request = match from_value::<RequestPayload>(received) {
            Ok(request) => request,
            Err(err) => {
                new_task!(sender.send_error(&format!(
                    "[nonBlockingServer] failed to deserialize request ({})",
                    err
                )));
                continue;
            }
        };
        match request {
            RequestPayload::Featurize(request) => {
                new_task!(featurize::featurize(request, task_spawner.clone(), sender))
            },
            RequestPayload::GenerateMimic(request) => {
                new_task!(generate_mimic::generate_mimic(request, sender))
            }
        }
    }
}
