import { BLKBackend } from "./lib/wk1/webworker/blocking.js";
import initWasm, { blockingServer, type Receiver, type Sender } from "./rust/faidr_desi";

const initServer = (recvToServer: Receiver, sendFromServer: Sender) =>
  initWasm().then(() => blockingServer(recvToServer, sendFromServer));
void BLKBackend(self, {
  initServer,
});
