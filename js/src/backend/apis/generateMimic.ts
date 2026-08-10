import { useBackend, type RecvMessage } from "@/backend";
import { useState } from "react";
import { InitializationError, Initialized } from "@/types/generateMimic";
import { mutationToString } from "@/lib/utils";
import * as z from "zod/mini";
import { DesignProgress, type DesignStatus } from "@/types/common";

export default function useGenerateMimicEndpoint(args: {
  sequence: string;
  featureConfiguration: unknown;
  featureWeights: Record<string, number>;
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
  };
  const [initError, setInitError] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<DesignStatus>(() => ({
    done: false,
    currentMutation: null,
    iterations: [],
  }));
  const [progressError, setProgressError] = useState<string | null>(null);
  const [startTimestamp, setStartTimestamp] = useState(() => Date.now());
  useBackend({
    msg: request,
    body: async (recv) => {
      const r = parseInit(await recv());
      if (r.ctrl === "break") {
        r.error !== null && setInitError(r.error);
        return;
      }
      setProgressData({
        iterations: [{
          sequence: r.data.sequence,
          featureDistance: r.data.featureDistance,
          iteration: 0,
          mutation: ""
        }],
        done: false,
        currentMutation: null
      })
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
      setInitError(null);
      setStartTimestamp(Date.now());
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
    initError,
    progressData,
    progressError,
    startTimestamp,
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
        ? de.data.reason
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
    const reason = z.prettifyError(de.error);
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
      data: (DesignProgress & { done: boolean })
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
  const de = DesignProgress.safeParse(progress.data);
  if (!de.success) {
    const reason = z.prettifyError(de.error);
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
