import { useBackend, type RecvMessage } from "@/backend";
import { useState } from "react";
import { EndpointResult, Featurized, InitializationError } from "@/types/featurize";
import z from "zod";

export default function useFeaturizeEndpoint(args: {
  sequence: string;
  featureConfiguration: unknown;
}) {
  const { sequence, featureConfiguration } = args;
  const request = {
    endpoint: "featurize",
    sequence,
    featureConfiguration,
  };
  const [error, setError] = useState<string | null>(null);
  const [featurized, setFeaturized] = useState<Record<
    string,
    Featurized
  > | null>(null);
  useBackend({
    msg: request,
    body: async (recv) => {
      const rResult = parseResult(await recv());
      if (rResult.ctrl === "break") {
        rResult.error !== null && setError(rResult.error);
        return;
      }
      setFeaturized(rResult.data);
    },
    setup: () => {
      setError(null);
      setFeaturized(null);
    },
    deps: [sequence, featureConfiguration],
  });
  return {
    featurizationError: error,
    featurized,
  };
}

function parseResult(result: RecvMessage):
  | {
      ctrl: "continue";
      data: Record<string, Featurized>
    }
  | {
      ctrl: "break";
      error: string | null;
    } {
  if (result.case === "unmounted")
    return {
      ctrl: "break",
      error: null,
    };
  if (result.case !== "close") {
    if (result.case === "error") {
      return {
        ctrl: "break",
        error: result.reason,
      };
    } else {
      const r = InitializationError.safeParse(result.data);
      return {
        ctrl: "break",
        error: r.success ? r.data.reason : z.prettifyError(r.error),
      };
    }
  }
  const r = EndpointResult.safeParse(result.data)
  if (!r.success) {
    return {
      ctrl: "break",
      error: z.prettifyError(r.error)
    }
  }
  return {
    ctrl: "continue",
    data: r.data.data
  };
}
