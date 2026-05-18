import { useBackend, type RecvMessage } from "@/backend";
import { SEQUENCE_VALIDATION_PARAMETERS } from "@/lib/consts";
import { useState } from "react";
import { Featurized, InitializationError, Progress } from "./types";
import z from "zod";

export default function useFeaturizeEndpoint(args: {
  sequence: string;
  featureConfiguration: unknown;
}) {
  const { sequence, featureConfiguration } = args;
  const request = {
    endpoint: "featurize",
    sequences: [sequence],
    featureConfiguration,
    sequenceValidationSettings: SEQUENCE_VALIDATION_PARAMETERS,
    statisticsIncluded: false,
  };
  const [initError, setInitError] = useState<string | null>(null);
  const [featurized, setFeaturized] = useState<Record<
    string,
    Featurized
  > | null>(null);
  const [featurizedError, setFeaturizedError] = useState<string | null>(null);
  useBackend({
    msg: request,
    body: async (recv) => {
      const rInit = parseInit(await recv());
      if (rInit.ctrl === "break") {
        rInit.error !== null && setInitError(rInit.error);
        return;
      }
      const rProgress = parseProgress(await recv());
      if (rProgress.ctrl === "break") {
        rProgress.error !== null && setFeaturizedError(rProgress.error);
        return;
      }
      setFeaturized(rProgress.data);
    },
    setup: () => {
      setInitError(null);
      setFeaturized(null);
      setFeaturizedError(null);
    },
    deps: [sequence, featureConfiguration],
  });
  return {
    initError,
    featurized,
    featurizedError,
  };
}

function parseInit(init: RecvMessage):
  | {
      ctrl: "continue";
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
    if (init.case === "error") {
      return {
        ctrl: "break",
        error: init.reason,
      };
    } else {
      const r = InitializationError.safeParse(init.data);
      console.log(init.data);
      return {
        ctrl: "break",
        error: r.success ? r.data.reason : z.prettifyError(r.error),
      };
    }
  }
  return {
    ctrl: "continue",
  };
}
function parseProgress(progress: RecvMessage):
  | {
      ctrl: "continue";
      data: Record<string, Featurized>;
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
  if (progress.case !== "yield") {
    const reason =
      progress.case === "error"
        ? progress.reason
        : "Unexpected error occurred.";
    return {
      ctrl: "break",
      error: reason,
    };
  }
  const de = Progress.safeParse(progress.data);
  if (!de.success) {
    const reason = z.prettifyError(de.error);
    return {
      ctrl: "break",
      error: reason,
    };
  } else {
    return {
      ctrl: "continue",
      data: de.data.sequenceByFeatureMatrix[0],
    };
  }
}
