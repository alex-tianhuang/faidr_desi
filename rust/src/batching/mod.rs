//! Module with various code related to batching and allocation logic.
pub(crate) mod sqrt_batching;

/// Assuming tasks are allocated as evenly as possible,
/// yield the number of tasks each worker will work on.
///
/// This function gives more work to the earlier workers.
pub fn even_allocation_sizes(
    num_tasks: usize,
    num_workers: usize,
) -> impl ExactSizeIterator<Item = usize> {
    let remainder = num_tasks % num_workers;
    let min_num_tasks_per_worker = num_tasks / num_workers;
    (0..num_workers)
        .map(move |worker_id| min_num_tasks_per_worker + (worker_id < remainder) as usize)
}
/// Two important parameters when constructing batches.
pub struct BatchingParameters {
    /// The number of tasks to do before reporting progress.
    pub batch_size: u32,
    /// The number of workers to use.
    pub num_workers: usize,
}
