import { Wk1BatchedPool } from "./framework/wk1/frontend/batched.js";
import { Wk1BLKPool } from "./framework/wk1/index.js";
import { NBBackend } from "./framework/wk1/webworker/nonBlocking.js";
import initWasm, {
  nonBlockingServer,
  type Receiver,
  type Sender,
  type TaskSpawner,
} from "./rust/idrdesign_app.js";
import { v4 as uuidv4 } from "uuid";
import Worker from "./wk1BLK.ts?worker";
const concurrency = Math.max(navigator.hardwareConcurrency, 1);
const blockingWorkers = new Wk1BatchedPool(
  new Wk1BLKPool(
    [...new Array(concurrency)].map(() => new Worker()),
    uuidv4,
  ),
);
const initServer = (
  recvToServer: Receiver,
  sendFromServer: Sender,
  spawnBatch: TaskSpawner["spawnBatch"],
) =>
  initWasm().then(() =>
    nonBlockingServer(recvToServer, sendFromServer, {
      spawnBatch,
    }),
  );
void NBBackend(self, initServer, blockingWorkers);
