//! A simple model for allocating batches and workers,
//! that assumes:
//! 1. The batch size for `N_w` workers is `N_w x one_worker_batch_size`,
//!    where `one_worker_batch_size` is the batch size for one worker.
//!    This relationship is consistent with batches being staggered out
//!    by a time `T_batch`, which is a fixed time regardless of the number
//!    of workers being used.
//! 2. If any worker is expected to complete less than one batch,
//!    it is not worth the overhead of coordinating an additional worker,
//!    and so the number of workers should be lowered (unless it is 1).
//!
//! The model is given the following context:
//! 1. A number of tasks.
//! 2. A batch size estimate appropriate for one worker.
//!    This estimate should represent the expected number of tasks
//!    that one single worker can be expected to complete within
//!    some fixed time limit `T_batch` (e.g. `T_batch=500ms`).
//! 3. The number of workers available.
//! 
//! Math
//! ----
//! ```
//! // Some abbreviations:
//! t   = num_tasks
//! b   = one_worker_batch_size
//! N_w = max_num_workers_to_run_at_least_one_batch_per_worker
//! B   = multi_worker_batch_size
//!     = N_w x b // as per Assumption 1 above.
//! t_w = expected_tasks_per_worker
//!     = t / N_w
//!
//! // Assumption 2 of the function doc says that no worker
//! // should be expected to complete less than one batch:
//!       t_w     >= B
//!    => t / N_w >= B
//!    => t / N_w >= N_w x b
//!    => t / b   >= N_w * N_w
//!    => N_w = (t / b).sqrt().floor()
//! 
//! // Hence, simple "square root" batching.
//! ```
use crate::batching::BatchingParameters;

/// Determine [`BatchingParameters`] using a model
/// described in the [module level docs].
/// 
/// [module level docs]: self
pub fn determine_batching_parameters(
    num_tasks: usize,
    one_worker_batch_size: f32,
    max_num_workers: usize,
) -> BatchingParameters {
    let num_workers = determine_num_workers(num_tasks, one_worker_batch_size, max_num_workers);
    BatchingParameters {
        batch_size: (num_workers as f32 * one_worker_batch_size).floor() as u32,
        num_workers,
    }
}
/// Determine number of workers using a model
/// described in the [module level docs].
/// 
/// [module level docs]: self
fn determine_num_workers(
    num_tasks: usize,
    one_worker_batch_size: f32,
    max_num_workers: usize,
) -> usize {
    let num_tasks = num_tasks as f32;
    if num_tasks < one_worker_batch_size || max_num_workers == 1 {
        return 1;
    };
    let max_num_workers_to_run_at_least_one_batch_per_worker =
        (num_tasks / one_worker_batch_size).sqrt().floor() as usize;
    max_num_workers_to_run_at_least_one_batch_per_worker.min(max_num_workers)
}
