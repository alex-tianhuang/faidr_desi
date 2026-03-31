import { useBackend, type RecvMessage } from "@/backend";
import { SEQUENCE_VALIDATION_PARAMETERS } from "@/lib/consts";
import { useState } from "react";
import { InitializationError, Initialized, Progress, type ProgressRaw } from "./types";
import { mutationToString } from "@/lib/utils";

export default function useGenerateMimicEndpoint(args: {
  sequence: string;
  featureConfiguration: unknown;
  featureWeights: unknown;
  rng: {
    seed: number;
  };
  reqTimestamp: number;
}) {
  const { sequence, featureConfiguration, featureWeights, rng, reqTimestamp } =
    args;
  const request = {
    endpoint: "generate-mimic",
    targetSequence: sequence,
    featureConfiguration,
    featureWeights,
    rng,
    sequenceValidationSettings: SEQUENCE_VALIDATION_PARAMETERS,
  };
  const [initData, setInitData] = useState<Initialized | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<Progress>(() => ({
    done: false,
    currentMutation: null,
    iterations: [],
  }));
  const [progressError, setProgressError] = useState<string | null>(null);
  useBackend({
    msg: request,
    body: async (recv) => {
      const r = parseInit(await recv());
      if (r.ctrl === "break") {
        r.error !== null && setInitError(r.error);
        return;
      }
      setInitData(r.data);
      const initDistance = r.data.featureDistance;
      while (true) {
        const r = parseProgress(await recv());
        if (r.ctrl === "break") {
          r.error !== null && setProgressError(r.error);
          return;
        }
        if (r.data.done) {
          setProgressData(({ iterations }) => ({ done: true, currentMutation: null, iterations }));
          return;
        }
        setProgressData(({ currentMutation, iterations }) => {
          const nextMutation = r.data.currentMutation ?? currentMutation;
          if (r.data.iterations.length === 0) {
            return {
              done: false,
              currentMutation: nextMutation,
              iterations,
            };
          }
          if (iterations.length === 0) {
            const firstRow = r.data.iterations[0];
            const { mutation, sequence } = firstRow;
            const initialSequence =
              sequence.substring(0, mutation.pos) +
              mutation.from +
              sequence.substring(mutation.pos + 1);
            iterations = [
              {
                mutation: "",
                featureDistance: initDistance,
                iteration: 0,
                sequence: initialSequence,
              },
            ];
          }
          return {
            done: false,
            currentMutation: nextMutation,
            iterations: [
              ...iterations,
              ...r.data.iterations.map((it, n) => ({
                ...it,
                iteration: n + iterations.length,
                mutation: mutationToString(it.mutation),
              })),
            ],
          };
        });
      }
    },
    setup: () => {
      setInitData(null);
      setInitError(null);
      setProgressData({
        done: false,
        currentMutation: null,
        iterations: [],
      });
      setProgressError(null);
    },
    deps: [sequence, featureConfiguration, featureWeights, rng, reqTimestamp],
  });
  return {
    initData,
    initError,
    progressData,
    progressError,
  };
}

function parseInit(init: RecvMessage):
  | {
      ctrl: "continue";
      data: Initialized;
    }
  | {
      ctrl: "break";
      error: string | null;
    } {
  if (init.case === "unmounted")
    return {
      ctrl: "break",
      error: null,
    };
  if (init.case !== "yield") {
    if (init.case === "close") {
      const de = InitializationError.safeParse(init.data);
      const reason = de.success
        ? de.data.error.reason
        : "Unexpected error occurred.";
      return {
        ctrl: "break",
        error: reason,
      };
    } else {
      return {
        ctrl: "break",
        error: init.reason,
      };
    }
  }
  const de = Initialized.safeParse(init.data);
  if (!de.success) {
    const reason = de.error.message;
    return {
      ctrl: "break",
      error: reason,
    };
  } else {
    return {
      ctrl: "continue",
      data: de.data,
    };
  }
}
function parseProgress(progress: RecvMessage):
  | {
      ctrl: "continue";
      data: ProgressRaw
    }
  | {
      ctrl: "break";
      error: string | null;
    } {
  if (progress.case === "unmounted")
    return {
      ctrl: "break",
      error: null,
    };
  if (progress.case === "error") {
    return {
      ctrl: "break",
      error: progress.reason,
    };
  }
  if (progress.case === "close") {
    return {
      ctrl: "continue",
      data: {
        done: true,
        currentMutation: undefined,
        iterations: [],
      },
    };
  }
  console.log(progress);
  const de = Progress.safeParse(progress.data);
  if (!de.success) {
    const reason = de.error.message;
    return {
      ctrl: "break",
      error: reason,
    };
  } else {
    return {
      ctrl: "continue",
      data: {
        done: false,
        currentMutation: de.data.currentMutation,
        iterations: de.data.iterations,
      },
    };
  }
}
