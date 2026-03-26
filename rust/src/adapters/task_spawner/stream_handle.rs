//! Module defining [`StreamHandle`].
use std::{
    cell::{Cell, RefCell},
    rc::{Rc, Weak},
    task::{Poll, Waker},
};

use crate::{
    adapters::{
        JsTypedFuture,
        task_spawner::{call_spawn_batch, recv_js_to_rust},
    },
    datatypes::webworker_messages::common::ResponsePayloadWithWorkerID,
};
use futures::{FutureExt, Stream, StreamExt};
use wasm_bindgen::{JsValue, UnwrapThrowExt, prelude::Closure};
use web_sys::js_sys::{Function, Promise};

/// Struct used by [`crate::adapters::TaskSpawner`] to represent an ongoing
/// connection in the [`crate::adapters::TaskSpawner::spawn_batch_streaming`]
/// function.
///
/// Use the [`StreamHandle::next_or_err`] or [`StreamHandle::next`]
/// methods to yield responses from this connection.
pub(crate) struct StreamHandle(Rc<Cell<Impl>>);
impl StreamHandle {
    /// Used in [`crate::adapters::TaskSpawner::spawn_batch_streaming`].
    pub(super) fn new(msg: JsValue, spawn_batch: Function) -> Self {
        Self(Rc::new(Cell::new(Impl::Unresumed { msg, spawn_batch })))
    }
    /// Same as [`StreamHandle::next`] but uses the fact that, in many use cases,
    /// the JS-side stream will always return something, even if it's an error
    /// response.
    ///
    /// Therefore the `None` case of the [`StreamHandle::next`]
    /// often corresponds to a developer error which should be logged.
    pub async fn next_or_err(&mut self) -> Result<<Self as Stream>::Item, JsValue> {
        self.next().await.ok_or_else(|| {
            format!("[StreamHandle::next_or_err] the channel was terminated somehow").into()
        })
    }
}
type Response = crate::datatypes::Response<String, ResponsePayloadWithWorkerID>;
/// Underlying state of the [`Stream`] for [`StreamHandle`].
///
/// This type is private because enum fields are public by default.
enum Impl {
    /// No polling has happened yet.
    ///
    /// Just holds the arguments to the function.
    Unresumed {
        /// Message to be sent to `spawnBatch`.
        msg: JsValue,
        /// The `spawnBatch` handler.
        spawn_batch: Function,
    },
    /// The `spawnBatch` handler has been called
    /// and will call `body_closure` asynchronously.
    SuspendForJS {
        /// Closure that JS can call for as long as the underlying
        /// promise is unresolved. It is only kept to prevent it
        /// from deallocating before JS calls it.
        ///
        /// This closure is made by [`Impl::construct_js_body_closure`].
        /// It contains a weak reference to the parent `Impl`.
        #[allow(unused)]
        body_closure: Closure<dyn FnMut(Function) -> Promise>,
        /// A waker to be called by `body_closure` when
        /// JS decides to call it.
        waker: Waker,
        /// The underlying promise returned by `spawnBatch`.
        ///
        /// Eventually, this will be awaited upon to see if
        /// there are no more messages left to yield.
        spawn_batch_promise: JsTypedFuture<()>,
    },
    /// The `spawnBatch` handler has called `body_closure`
    /// (whether from the stack or asynchronously) and has
    /// passed in the JS function to receive messages from JS.
    Receiving {
        /// The JS handler `recv`.
        ///
        /// Calling this returns a promise that resolves
        /// on the next message from JS.
        receiver: Box<dyn Fn() -> JsTypedFuture<Response>>,
        /// A slot for the current promise being awaited on,
        /// constructed by calling [`Impl::Receiving::receiver`].
        next_promise: Option<JsTypedFuture<Response>>,
        /// The underlying promise returned by `spawnBatch`.
        ///
        /// Eventually, calling [`Impl::Receiving::receiver`]
        /// will return an error from JS saying the channel
        /// is closed or an error has been received from a subworker.
        ///
        /// That will signal that probably the stream will end soon.
        /// However, when the promise returned by `spawnBatch` ends,
        /// then I definitely know there are no more messages.
        spawn_batch_promise: JsTypedFuture<()>,
        /// Token that resolves a JS-side promise when dropped.
        ///
        /// The JS `communicate` function will wait for as long
        /// as this is held in memory before cleaning up its
        /// resources.
        #[allow(unused)]
        promise_guard: ResolvePromiseGuard,
    },
    /// Final state of the stream, or
    /// a placeholder to put when getting values out
    /// of a cell using [`Cell::replace`].
    Terminated,
}
impl Stream for StreamHandle {
    type Item = <JsTypedFuture<Response> as Future>::Output;
    fn poll_next(
        self: std::pin::Pin<&mut Self>,
        cx: &mut std::task::Context<'_>,
    ) -> std::task::Poll<Option<Self::Item>> {
        let this = &mut self.get_mut().0;
        loop {
            let Some(current_state) = Rc::get_mut(this) else {
                // This `Rc` is only cloned in the block defining `body_closure`.
                // That means it is not unique for as long as `body_closure` exists.
                //
                // Equivalently, this block of code only runs when `Impl::SuspendForJS`
                // is in the memory location.
                Impl::replace_waker(this, cx);
                return Poll::Pending;
            };
            match current_state.get_mut() {
                Impl::Unresumed { .. } => {
                    Impl::first_poll(this, cx);
                }
                Impl::SuspendForJS { .. } => {
                    Impl::replace_waker(this, cx);
                    return Poll::Pending;
                }
                Impl::Receiving { .. } => {
                    return Impl::poll_to_receive(current_state, cx).map(Some);
                }
                Impl::Terminated => return Poll::Ready(None),
            }
        }
    }
}
impl Impl {
    /// Assuming the [`Impl`] is an [`Impl::Unresumed`],
    /// set up the self-referential `body_closure` that `spawnBatch` will call,
    /// and send it to `spawnBatch` to get a `spawn_batch_promise` that resolves
    /// when JS is out of messages.
    ///
    /// See also [`Impl::construct_js_body_closure`].
    fn first_poll(this: &Rc<Cell<Impl>>, cx: &std::task::Context<'_>) {
        let Impl::Unresumed { msg, spawn_batch } = this.replace(Impl::Terminated) else {
            panic!(
                "[StreamHandle::poll_next] called `Impl::first_poll` with non `Impl::Unresumed` instance"
            )
        };
        let early_return_slot = Rc::new(RefCell::new(None));
        let body_closure = Closure::once(Box::new(Impl::construct_js_body_closure(
            Rc::downgrade(this),
            Rc::clone(&early_return_slot),
        )) as Box<dyn FnOnce(Function) -> Promise>);
        // Feb 14th, 2026
        // --------------
        // There is maybe a footgun here if the CPU decides to run (reorder)
        // this instruction before this.replace(Impl::Terminated) above.
        // It would mean that the cell contains an `Impl::Unresumed` and
        // so the inner closure of [`Impl::construct_js_body_closure`] would panic.
        //
        // I don't know enough about CPU reordering to figure out if this
        // outcome will materialize, but this would crash the server.
        //
        // Right now I'll cross my fingers and pray, but if this does take down
        // the server, I'll go read about fences and reordering.
        let spawn_batch_promise = call_spawn_batch!(spawn_batch, msg, body_closure);
        if let Some((receiver, promise_guard)) = early_return_slot.borrow_mut().take() {
            this.set(Impl::Receiving {
                receiver,
                next_promise: None,
                spawn_batch_promise,
                promise_guard,
            });
        } else {
            this.set(Impl::SuspendForJS {
                waker: cx.waker().clone(),
                body_closure,
                spawn_batch_promise,
            });
        }
    }
    /// Closure expected by JS's `spawnBatch` handler,
    /// to be called synchronously or asynchronously in JS.
    ///
    /// When this closure is called, JS is expecting a promise
    /// that resolves when the rust-side caller is not waiting for any
    /// more messages.
    fn construct_js_body_closure(
        this: Weak<Cell<Impl>>,
        early_return_slot: Rc<
            RefCell<
                Option<(
                    Box<dyn Fn() -> JsTypedFuture<Response>>,
                    ResolvePromiseGuard,
                )>,
            >,
        >,
    ) -> impl Fn(Function) -> Promise {
        move |recv| {
            let Some(this) = this.upgrade() else {
                // `spawnBatch` calls `body` after the `StreamHandle` has been dropped.
                return Promise::resolve(&JsValue::NULL);
            };
            let receiver = recv_js_to_rust!(recv) as Box<_>;
            let (promise_guard, promise_for_js) = ResolvePromiseGuard::new_pair();
            match this.replace(Impl::Terminated) {
                // 99% of cases, where `spawnBatch` has called `body` asynchronously.
                Impl::SuspendForJS {
                    waker,
                    spawn_batch_promise,
                    ..
                } => {
                    this.set(Impl::Receiving {
                        receiver,
                        next_promise: None,
                        spawn_batch_promise,
                        promise_guard,
                    });
                    waker.wake();
                }
                // `spawnBatch` eagerly (before returning) calls `body`.
                Impl::Terminated => {
                    *early_return_slot.borrow_mut() = Some((receiver, promise_guard));
                }
                // If you get to here, read the dev note in
                // `Impl::first_poll` (Feb 14th, 2026).
                _ => {
                    panic!(
                        "[StreamHandle::poll_next] expected `Impl::SuspendForJS` or `Impl::Terminated`"
                    )
                }
            };
            promise_for_js
        }
    }
    /// Assuming the [`Impl`] is an [`Impl::SuspendForJS`],
    /// replace the waker field with the current context's waker.
    fn replace_waker(this: &Cell<Impl>, cx: &std::task::Context<'_>) {
        let Impl::SuspendForJS {
            body_closure,
            spawn_batch_promise,
            mut waker,
        } = this.replace(Impl::Terminated)
        else {
            panic!(
                "[StreamHandle::poll_next] called `Impl::replace_waker` with non `Impl::SuspendForJS` instance"
            )
        };
        waker.clone_from(cx.waker());
        this.set(Impl::SuspendForJS {
            body_closure,
            waker,
            spawn_batch_promise,
        });
    }
    /// Assuming the [`Impl`] is an [`Impl::Receiving`],
    /// poll the [`Impl::Receiving::next_promise`] to get the next message.
    ///
    /// If an error message is returned, it assumes the connection will close
    /// quickly and begins polling the [`Impl::Receiving::spawn_batch_promise`].
    /// When that promise resolves, it terminates this stream.
    fn poll_to_receive(
        this: &mut Cell<Impl>,
        cx: &mut std::task::Context<'_>,
    ) -> std::task::Poll<<JsTypedFuture<Response> as Future>::Output> {
        let Impl::Receiving {
            receiver,
            next_promise,
            spawn_batch_promise,
            ..
        } = this.get_mut()
        else {
            panic!(
                "[StreamHandle::poll_next] called `Impl::poll_to_receive` with non `Impl::Receiving` instance"
            )
        };
        let fut = next_promise.get_or_insert_with(receiver);
        let result = fut.poll_unpin(cx);
        if let Poll::Ready(result) = &result {
            *next_promise = None;
            if matches!(result, Err(_) | Ok(Response::Error { .. })) {
                match spawn_batch_promise.poll_unpin(cx) {
                    Poll::Ready(Ok(())) => {
                        this.set(Impl::Terminated);
                    }
                    Poll::Ready(Err(_)) => {
                        panic!(
                            "[StreamHandle::poll_next] `spawnBatch` JS handler should always return a nullable value"
                        )
                    }
                    Poll::Pending => (),
                }
            }
        }
        result
    }
}
/// Token that resolves a JS-side promise when dropped.
struct ResolvePromiseGuard(Function);
impl ResolvePromiseGuard {
    /// Construct together a guard and the promise
    /// that will resolve when the guard is dropped.
    fn new_pair() -> (Self, Promise) {
        let mut this = None;
        let promise = Promise::new(&mut |resolve, _| this = Some(ResolvePromiseGuard(resolve)));
        (
            this.expect_throw("[PromiseGuard] JS `Promise::new` did not run"),
            promise,
        )
    }
}
impl Drop for ResolvePromiseGuard {
    fn drop(&mut self) {
        let _: Result<_, _> = self.0.call0(&JsValue::NULL);
    }
}
