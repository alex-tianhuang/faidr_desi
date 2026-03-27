import { communicate, type RecvMessage } from "./framework";
import { Wk1NBPool } from "./framework/wk1";
import Worker from "./wk1NB.ts?worker&inline";
const pool = new Wk1NBPool(new Worker(), () => crypto.randomUUID());
export function backend(
  msg: unknown,
  body: (recv: () => Promise<RecvMessage<unknown, unknown>>) => Promise<void>,
) {
  return communicate(
    pool,
    {
      data: msg,
    },
    body,
  );
}
