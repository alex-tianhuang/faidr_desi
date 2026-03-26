use crate::{
    TaskSpawner,
    adapters::SenderHandle,
    datatypes::{Request, webworker_messages::non_blocking::featurize::RequestPayload},
    servers::non_blocking::featurize::{
        batch_work::{BatchedWorkFeaturize, batch_work_featurize},
        progress::loop_report_progress_featurize,
    },
};
use initialize::{InitJobFeaturize, init_job_featurize};
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

/// Endpoint for computing sequence features of many sequences.
///
/// The user-facing contract is described in [`crate::datatypes::webworker_messages::non_blocking::featurize`].
pub async fn featurize(
    request: RequestPayload,
    task_spawner: TaskSpawner,
    sender: SenderHandle,
) -> Result<(), JsValue> {
    let InitJobFeaturize {
        sequences,
        feat_order,
        statistics_included,
        sender,
    } = tri!(init_job_featurize(
        request.sequences,
        request.sequence_validation_settings,
        &request.feature_configuration,
        request.statistics_included,
        sender,
    ));
    let BatchedWorkFeaturize {
        sequence_ids,
        requests,
    } = batch_work_featurize(
        sequences,
        &request.feature_configuration,
        statistics_included,
        task_spawner.num_workers(),
    );
    loop_report_progress_featurize(
        task_spawner.spawn_batch_streaming(Request { data: requests }),
        sequence_ids,
        feat_order,
        statistics_included,
        sender,
    )
    .await
}

/// Module defining [`init_job_featurize`].
mod initialize {
    use crate::{
        AAStringValidationParameters,
        adapters::{PseudoMap, SenderHandle},
        datatypes::{
            AACanonicalString,
            webworker_messages::non_blocking::featurize::{
                ClosePayload, Initialized, YieldPayload,
            },
        },
        seq_features::featurize::{FeatureContainerUserFacing, FeaturizerCompilation},
        servers::non_blocking::common::{
            ValidatedSequences, compile_and_validate_features, merge_sequences, validate_sequences,
        },
    };
    use std::ops::ControlFlow;
    use wasm_bindgen::JsValue;

    /// Data that [`init_job_featurize`] returns.
    pub struct InitJobFeaturize<'a> {
        /// Sequences to featurize, plus the index that they arrived at.
        pub sequences: Vec<(u32, AACanonicalString)>,
        /// Order of features, for decoding index-organized feature vectors.
        pub feat_order: Vec<&'a str>,
        /// Whether or not statistics will be included in responses
        /// from this endpoint.
        pub statistics_included: bool,
        /// The place to send responses, which had to be
        /// consumed and returned by the [`init_job_featurize`] method.
        pub sender: SenderHandle,
    }
    /// Validates sequences, then compiles features
    /// (and validates that there is at least one feature).
    ///
    /// If both conditions are satisified, this function sends the initial
    /// summary ([`YieldPayload::Initialized`]) of the job to the frontend.
    ///
    /// If either validation step fails, it sends an error using the
    /// [`SenderHandle`] and returns `Ok(())`. `Err` variants are reserved
    /// for hang ups on the JS side of sending messages only.
    pub async fn init_job_featurize(
        sequences: Vec<String>,
        sequence_validation_settings: AAStringValidationParameters,
        feature_configuration: &FeatureContainerUserFacing,
        statistics_included: bool,
        sender: SenderHandle,
    ) -> Result<ControlFlow<(), InitJobFeaturize<'_>>, JsValue> {
        let ValidatedSequences {
            unmodified_sequences,
            modified_sequences,
            sequence_validation_errors,
        } = match validate_sequences(sequences, sequence_validation_settings) {
            Ok(data) => data,
            Err(error) => {
                sender
                    .send_close(&ClosePayload::InitializationError(error))
                    .await?;
                return Ok(ControlFlow::Break(()));
            }
        };
        let statistics_included = statistics_included
            && determine_if_statistics_can_be_included(
                unmodified_sequences.len() + modified_sequences.len(),
            );
        let FeaturizerCompilation {
            feat_order,
            compile_errors,
            ..
        } = match compile_and_validate_features(&feature_configuration) {
            Ok(data) => data,
            Err(mut error) => {
                error.sequence_validation_errors = sequence_validation_errors;
                sender
                    .send_close(&ClosePayload::InitializationError(error))
                    .await?;
                return Ok(ControlFlow::Break(()));
            }
        };
        let initialized = Initialized {
            sequence_validation_errors,
            modified_sequences,
            feature_compile_errors: PseudoMap::from(compile_errors),
            statistics_included,
        };
        let sender = sender
            .send_data(&YieldPayload::Initialized(&initialized))
            .await?;
        let sequences = merge_sequences(
            unmodified_sequences,
            initialized.modified_sequences.into_vec(),
        );
        Ok(ControlFlow::Continue(InitJobFeaturize {
            sequences,
            feat_order,
            statistics_included,
            sender,
        }))
    }
    /// Returns true if this response's endpoints will involve
    /// statistics of the sequence feature distributions.
    ///
    /// If there are too few sequences, don't include statistics.
    fn determine_if_statistics_can_be_included(n_sequences: usize) -> bool {
        /// The minimum number of sequences required for
        /// the endpoint to report feature statistics.
        const STATISTICS_INCLUDED_THRESHOLD: usize = 2;
        n_sequences >= STATISTICS_INCLUDED_THRESHOLD
    }
}
/// Module defining [`batch_work_featurize`].
mod batch_work {
    use std::vec;

    use crate::{
        adapters::{JsValuePreserved, serialize},
        batching::{
            BatchingParameters, even_allocation_sizes, sqrt_batching::determine_batching_parameters,
        },
        datatypes::{AACanonicalString, webworker_messages::blocking},
        seq_features::featurize::FeatureContainerUserFacing,
    };

    /// Return type of [`batch_work_featurize`].
    pub struct BatchedWorkFeaturize {
        /// Sequence IDs used to decode unlabelled results.
        pub sequence_ids: Vec<vec::IntoIter<u32>>,
        /// Requests for each worker.
        pub requests: Vec<JsValuePreserved>,
    }
    /// Organizes the sequences to featurized into
    /// requests and sequence IDs for each worker.
    pub fn batch_work_featurize(
        sequences: Vec<(u32, AACanonicalString)>,
        feature_configuration: &FeatureContainerUserFacing,
        statistics_included: bool,
        max_num_workers: usize,
    ) -> BatchedWorkFeaturize {
        let BatchingParameters {
            batch_size,
            num_workers,
        } = determine_batching_parameters(
            sequences.len(),
            determine_num_sequences_for_one_worker_batch(),
            max_num_workers,
        );
        let mut sequences = sequences.into_iter();
        let mut sequence_ids = Vec::with_capacity(num_workers);
        let mut requests = Vec::with_capacity(num_workers);
        let feature_configuration_preserialized =
            JsValuePreserved::new(serialize(feature_configuration));
        for num_sequences_for_worker in even_allocation_sizes(sequences.len(), num_workers) {
            let sequences_for_worker = (&mut sequences).take(num_sequences_for_worker);
            let Workload {
                worker_sequence_ids,
                worker_request,
            } = construct_workload_for_one_worker(
                sequences_for_worker,
                batch_size,
                feature_configuration_preserialized.clone(),
                statistics_included,
            );
            sequence_ids.push(worker_sequence_ids.into_iter());
            requests.push(worker_request);
        }
        BatchedWorkFeaturize {
            sequence_ids,
            requests,
        }
    }
    /// Estimate the number of sequences that are required for
    /// a single worker to take about 0.5ms running one batch.
    ///
    /// Dev note
    /// --------
    /// Yes this looks stupid but I think including a dynamically
    /// maintained featurizer-to-time-per-sequence database
    /// to estimate this properly requires much more thought
    /// than I currently want to put into this.
    ///
    /// When I ran the IDRome for Yuxi,
    /// it was about 800 iterations/second in python.
    fn determine_num_sequences_for_one_worker_batch() -> f64 {
        const NUM_SEQUENCES_FOR_HALF_A_SECOND: f64 = 400.0;
        NUM_SEQUENCES_FOR_HALF_A_SECOND
    }
    /// See [`construct_workload_for_one_worker`].
    struct Workload {
        /// Sequence IDs for all the sequences this worker will take on.
        ///
        /// Used to decode the results from the worker, which will
        /// be unlabelled but maintain the same order as sequences passed
        /// in.
        worker_sequence_ids: Vec<u32>,
        /// Request sent to this worker (contains sequences, features, etc.).
        worker_request: JsValuePreserved,
    }
    /// Given the sequences a worker will be responsible for, construct
    /// the data needed to send the request to the blocking worker and
    /// decode the response.
    fn construct_workload_for_one_worker(
        worker_sequences: impl ExactSizeIterator<Item = (u32, AACanonicalString)>,
        batch_size: u32,
        feature_configuration_preserialized: JsValuePreserved,
        statistics_included: bool,
    ) -> Workload {
        let (worker_sequence_ids, worker_sequences): (Vec<_>, Vec<_>) = worker_sequences.unzip();
        let worker_request = blocking::RequestPayload::WebworkerFeaturize(
            blocking::webworker_featurize::RequestPayload::Serialize {
                batch_size,
                sequences: worker_sequences,
                feature_configuration_preserialized,
                statistics_included,
            },
        );
        Workload {
            worker_sequence_ids,
            worker_request: JsValuePreserved::new(serialize(&worker_request)),
        }
    }
}

/// Module defining [`loop_report_progress_featurize`].
mod progress {
    use crate::{
        ResponsePayloadWithWorkerID,
        adapters::{JsValuePreserved, PseudoMap, SenderHandle, StreamHandle},
        datatypes::{
            Response, StandardStatisticsVec,
            webworker_messages::{
                blocking,
                common::featurize::Featurized,
                non_blocking::featurize::{
                    ClosePayload, Progress, StandardFeatureStatistics, YieldPayload,
                },
            },
        },
    };
    use serde_wasm_bindgen::from_value;
    use std::{ops::ControlFlow, vec};
    use wasm_bindgen::{JsValue, UnwrapThrowExt};

    /// Decode the unlabelled feature results yielded from `computation`
    /// into [`YieldPayload`]s, and send them to the frontend.
    pub async fn loop_report_progress_featurize(
        mut computation: StreamHandle,
        sequence_ids: Vec<vec::IntoIter<u32>>,
        feat_order: Vec<&str>,
        statistics_included: bool,
        mut sender: SenderHandle,
    ) -> Result<(), JsValue> {
        let mut progress = ProgressManager::new(feat_order, sequence_ids, statistics_included);
        let mut num_workers_remaining = progress.num_workers();
        loop {
            match computation.next_or_err().await?.map_err(|e| e.reject())? {
                Response::Yield {
                    data: ResponsePayloadWithWorkerID { worker_id, data },
                } => {
                    let message: blocking::webworker_featurize::YieldPayload;
                    (message, sender) = tri!(deserialize_worker_response_data(data, sender));
                    progress.decode_message(message, worker_id);
                    sender = progress.flush_progress(sender).await?;
                }
                Response::Close { .. } => {
                    num_workers_remaining -= 1;
                    if num_workers_remaining > 0 {
                        continue;
                    }
                    return sender.send_close(&ClosePayload::Ok).await;
                }
                Response::Error { reason } => {
                    sender.send_error(&reason).await?;
                    return Ok(());
                }
            }
        }
    }
    /// Deserializes an untyped yield response from a `webworker_featurize` worker.
    ///
    /// This function exists because it's a bit annoying to read in the main
    /// function (it's a bit long).
    async fn deserialize_worker_response_data(
        response_data: JsValuePreserved,
        sender: SenderHandle,
    ) -> Result<ControlFlow<(), (blocking::webworker_featurize::YieldPayload, SenderHandle)>, JsValue>
    {
        match from_value::<blocking::webworker_featurize::YieldPayload>(response_data.into_inner())
        {
            Ok(response) => Ok(ControlFlow::Continue((response, sender))),
            Err(error) => {
                sender.send_error(&format!("{}", error)).await?;
                Ok(ControlFlow::Break(()))
            }
        }
    }
    /// A struct for converting between the private (blocking `webworker_featurize`)
    /// output format and the index-labelled / feature-ID labelled format of
    /// the public `featurize` endpoint.
    struct ProgressManager<'a> {
        /// Feature ID for each index.
        feat_order: Vec<&'a str>,
        /// Sequence IDs of sequences taken on by each worker.
        sequence_id_decoder: SequenceIDsDecoder,
        /// A buffer in which to write [`Progress`] values
        /// and accumulate feature statistics.
        progress_buffer: Progress<'a>,
        /// A buffer in which to accumulate unlabelled feature statistics.
        ///
        /// This then is converted into feature ID labelled statistics
        /// in [`Progress::feature_statistics`].
        master_statistics_buffer: Option<StandardStatisticsVec>,
        /// A buffer containing vectors with the correct allocation
        /// size but which are not in use right now.
        spare_vectors: Vec<PseudoMap<&'a str, Featurized>>,
    }
    impl<'a> ProgressManager<'a> {
        /// Construct a new progress manager struct.
        pub fn new(
            feat_order: Vec<&'a str>,
            sequence_ids: Vec<vec::IntoIter<u32>>,
            statistics_included: bool,
        ) -> Self {
            Self {
                progress_buffer: Progress {
                    sequence_by_feature_matrix: PseudoMap::default(),
                    feature_statistics: statistics_included
                        .then(|| StandardFeatureStatistics::new(feat_order.iter().cloned())),
                },
                master_statistics_buffer: statistics_included
                    .then(|| StandardStatisticsVec::new(feat_order.len())),
                spare_vectors: Vec::default(),
                feat_order,
                sequence_id_decoder: SequenceIDsDecoder::new(sequence_ids),
            }
        }
        /// Given progress and a worker ID,
        /// accumulate the given results into [`ProgressManager::progress_buffer`].
        pub fn decode_message(
            &mut self,
            message: blocking::webworker_featurize::YieldPayload,
            worker_id: u32,
        ) {
            let ProgressManager {
                progress_buffer,
                spare_vectors,
                feat_order,
                sequence_id_decoder,
                ..
            } = self;
            let blocking::webworker_featurize::YieldPayload {
                sequence_by_feature_matrix,
                ..
            } = message;
            let num_sequences_in_batch = sequence_by_feature_matrix.len() / feat_order.len();
            debug_assert_eq!(sequence_by_feature_matrix.len() % feat_order.len(), 0);
            let mut sequence_by_feature_matrix = sequence_by_feature_matrix.into_iter();
            for sequence_id in sequence_id_decoder
                .consume_n_sequence_ids_for_worker(num_sequences_in_batch, worker_id)
            {
                let mut result_vector = spare_vectors
                    .pop()
                    .unwrap_or_else(|| PseudoMap::with_capacity(feat_order.len()));
                result_vector.extend(
                    feat_order
                        .iter()
                        .cloned()
                        .zip((&mut sequence_by_feature_matrix).take(feat_order.len())),
                );
                progress_buffer
                    .sequence_by_feature_matrix
                    .push((sequence_id, result_vector))
            }
            self.accumulate_statistics(message.feature_statistics);
        }
        /// Serialize and send the progress to the frontend.
        pub async fn flush_progress(
            &mut self,
            sender: SenderHandle,
        ) -> Result<SenderHandle, JsValue> {
            self.flush_statistics();
            let sender = sender
                .send_data(&YieldPayload::Progress(&self.progress_buffer))
                .await?;
            self.clear_sequence_by_feature_matrix();
            Ok(sender)
        }
        /// Number of workers for which this struct is decoding results for.
        pub fn num_workers(&self) -> usize {
            self.sequence_id_decoder.data.len()
        }
        /// Shorthand for adding one batch's statistics to the master
        /// statistics if requested.
        fn accumulate_statistics(&mut self, batch_statistics: Option<StandardStatisticsVec>) {
            if let Some(master_statistics) = &mut self.master_statistics_buffer {
                *master_statistics += batch_statistics.as_ref().expect_throw(
                    "[featurize::progress] expected that feature statistics are included",
                );
            };
        }
        /// Shorthand for decoding the unlabelled master statistics
        /// into the feature ID labelled stats in theprogress buffer,
        /// if requested.
        fn flush_statistics(&mut self) {
            if let Some(feature_id_labelled_statistics) =
                &mut self.progress_buffer.feature_statistics
            {
                feature_id_labelled_statistics.compute(
                    self.master_statistics_buffer.as_ref().expect(
                        "[featurize::progress] expected that feature statistics are included",
                    ),
                )
            }
        }
        /// Clear the sequence by feature matrix, but save the allocated vectors.
        fn clear_sequence_by_feature_matrix(&mut self) {
            let Self {
                progress_buffer,
                spare_vectors,
                ..
            } = self;
            spare_vectors.extend(
                progress_buffer
                    .sequence_by_feature_matrix
                    .drain(..)
                    .rev()
                    .map(|(_, vec)| vec),
            );
        }
    }
    /// Sequence IDs of sequences taken on by each worker.
    ///
    /// Used to decode (provide sequence identifiers for)
    /// unlabelled results coming from subworkers.
    struct SequenceIDsDecoder {
        data: Vec<vec::IntoIter<u32>>,
    }
    impl SequenceIDsDecoder {
        /// Construct a new decoder from the given data.
        pub fn new(data: Vec<vec::IntoIter<u32>>) -> Self {
            Self { data }
        }
        /// Get the next `n` sequence IDs
        /// associated to the given worker ID.
        pub fn consume_n_sequence_ids_for_worker(
            &mut self,
            n: usize,
            worker_id: u32,
        ) -> impl ExactSizeIterator<Item = u32> {
            (&mut self.data[worker_id as usize]).take(n)
        }
    }
}
