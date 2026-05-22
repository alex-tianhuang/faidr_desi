/**
 * Module defining {@link Wk1BatchedPool}.
 */
import z from "zod";
import { communicate, type Conn, type ConnPool, type SynMessage } from "../..";
import type { Wk1BLKPool } from "./blocking";
import { Wk1Conn } from "./common";

/**
 * Arbitrary data attached to a `workerID` field.
 *
 * Yielded in messages by {@link Wk1BatchedPool}.
 */
export type ResponseWithWorkerID = z.infer<typeof ResponseWithWorkerIDSchema>;

/**
 * Module defining a sub-worker wrapper that batches
 * jobs and merges all responses from those jobs.
 */
export class Wk1BatchedPool<R> implements ConnPool<
  R[],
  ResponseWithWorkerID,
  ResponseWithWorkerID
> {
  /** Inner blocking pool used to manage jobs. */
  private readonly inner: Wk1BLKPool<R>;
  /**
   * Queue of unsubmitted batches.
   *
   * Sorted by batch-size (length of messages passed in.)
   */
  private readonly queue: Batch<R>[];
  /**
   * Active number of connections.
   */
  private countEngaged: number;
  constructor(inner: Wk1BLKPool<R>) {
    this.inner = inner;
    this.queue = [];
    this.countEngaged = 0;
  }
  /** @inheritdoc ConnPool.post */
  post(
    msg: SynMessage<R[]>,
  ): Promise<Conn<ResponseWithWorkerID, ResponseWithWorkerID>> {
    let waiters: Batch<R>["waiters"];
    const promise = new Promise<
      Conn<ResponseWithWorkerID, ResponseWithWorkerID>
    >((resolve, reject) => (waiters = [resolve, reject]));
    const batch: Batch<R> = {
      msg,
      waiters: waiters!,
    };
    const batchSize = msg.data.length;
    const insertIndex = this.queue.findIndex(
      (batch) => batch.msg.data.length <= batchSize,
    );
    if (insertIndex === -1) {
      this.queue.push(batch);
    } else {
      this.queue.splice(insertIndex, 0, batch);
    }
    this.consumeWork();
    return promise;
  }
  /**
   * Helper method to get the smallest job and run it, if enough sub-workers
   * are available.
   */
  private consumeWork() {
    const batch = this.queue.at(-1);
    if (batch === undefined || !this.shouldRunBatch(batch.msg.data.length))
      return;
    this.countEngaged += batch.msg.data.length;
    void this.runBatch(this.queue.pop()!);
  }
  /**
   * Determine if a batch of length `n` should be run.
   * 
   * The rules are not set in stone, so I'm not describing
   * them in the docs. For more info, read three lines of code.
   */
  private shouldRunBatch(n: number): boolean {
    if (this.countEngaged === 0) return true;
    if (this.inner.size() < this.countEngaged + n) return false;
    return true;
  }
  /**
   * Assuming there is enough space, run all sub-tasks in the workers
   * and coalesce all the responses through one {@link Wk1Conn}.
   *
   * @param batch - Batch to run.
   * @returns - Promise that finishes when the connection is hung up
   *            or all sub-tasks are finished.
   */
  private runBatch(batch: Batch<R>): Promise<void> {
    const { msg } = batch;
    const numWorkers = msg.data.length;
    let postWaiters: Batch<R>["waiters"] | null = batch.waiters;
    let numStarted = 0;
    let hupWaiters: [() => void, (_: Error) => void];
    const hupPromise = new Promise<void>(
      (resolve, reject) => (hupWaiters = [resolve, reject]),
    );
    hupWaiters = hupWaiters!;
    let closed = false;
    const connUntyped = new Wk1Conn(() => Promise.resolve());
    const conn: Conn<ResponseWithWorkerID, ResponseWithWorkerID> = {
      recv: () =>
        connUntyped.recv().then((msg) => {
          if (msg.case === "error") return msg;
          const parsed = ResponseWithWorkerIDSchema.safeParse(msg.data);
          if (parsed.success) {
            return { case: msg.case, data: parsed.data };
          } else {
            return {
              case: "error",
              reason:
                "could not parse batched backend response as having workerID",
            };
          }
        }),
      close: () => {
        const [resolve, _] = hupWaiters;
        if (!closed) resolve();
        closed = true;
        return connUntyped.close();
      },
    };
    const subTasks = Promise.all(
      [...msg.data.entries()].map(async ([workerID, data]) => {
        try {
          await communicate(this.inner, { data }, async (recv) => {
            numStarted += 1;
            if (numStarted === numWorkers) {
              const [resolvePost, _] = postWaiters!;
              resolvePost(conn);
              postWaiters = null;
            }
            while (!closed) {
              const msg = await Promise.race([recv(), hupPromise]);
              if (typeof msg !== "object") break;
              if (msg.case === "yield" || msg.case === "close") {
                connUntyped.onmessage({
                  case: msg.case,
                  data: { workerID, data: msg.data },
                });
              } else {
                connUntyped.onmessage(msg);
                conn.close();
              }
              if (msg.case === "close" || msg.case === "error") {
                return;
              }
            }
          });
        } finally {
          this.countEngaged -= 1;
          this.consumeWork();
        }
      }),
    )
      .catch((reason) => {
        if (!closed) {
          const [_, reject] = hupWaiters;
          reject(reason);
        }
      })
      .finally(() => {
        if (numStarted < numWorkers && postWaiters !== null) {
          const [_, rejectPost] = postWaiters;
          rejectPost(
            new Error(
              "[Wk1BatchedPool] failed to start all backends and was not closed",
            ),
          );
        }
      });
    return Promise.race([subTasks, hupPromise]).then(() => {});
  }
}

/** Helper validating for messages. */
const ResponseWithWorkerIDSchema = z.object({
  data: z.unknown(),
  workerID: z.number(),
});
/**
 * Helper type consisting of a not-yet sent message and some waiters
 * for {@link Wk1BatchedPool.post}.
 */
type Batch<R> = {
  /** Messages to be sent. */
  msg: SynMessage<R[]>;
  /**
   * Handler pair for the `post` promise.
   *
   * Resolved after all sub-workers have started.
   */
  waiters: [
    (_: Conn<ResponseWithWorkerID, ResponseWithWorkerID>) => void,
    (_: Error) => void,
  ];
};
