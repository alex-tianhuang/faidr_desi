import { BLKBackend } from "./framework/wk1/webworker/blocking.js";
import initWasm, { blockingServer, type Receiver, type Sender } from "./rust/idrdesign_app.js";

const initServer = (recvToServer: Receiver, sendFromServer: Sender) =>
  initWasm().then(() => blockingServer(recvToServer, sendFromServer));
void BLKBackend(self, {
  initServer,
});
