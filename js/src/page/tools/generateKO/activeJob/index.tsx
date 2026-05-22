import useGenerateKOEndpoint from "@/backend/apis/generateKO";
import { NormalError, UnexpectedError } from "@/components/errors";
import DesignedSequence from "./designedSequence";
import DesignNotDone from "@/components/designNotDone";
import { DesignIterationsTable } from "@/components/designIterationsTable";

export default function GenerateKOActiveJob(props: {
  sequence: string;
  featureConfiguration: unknown;
  featureWeights: Record<string, number>;
  featureTargets: Record<string, number>;
  reqTimestamp: number;
}) {
  const { initError, progressData, progressError, startTimestamp } =
    useGenerateKOEndpoint(props);
  const designedSequence =
    (progressData.done ? progressData.iterations.at(-1)?.sequence : null) ??
    null;
  const error = initError ?? progressError;
  if (error) {
    return (
      <UnexpectedError
        while="designing your knock out sequence"
        error={error}
      ></UnexpectedError>
    );
  }
  const localOptError =
    progressData?.done && progressData.iterations.length === 1;
  if (localOptError) {
    const LOCAL_OPT_ERROR_MESSAGE =
      "Starting sequence is already at local optimum in feature space. This can happen when too few features are allowed to vary and the system becomes overconstrained. We recommend choosing more or different features to knockout.";
    return (
      <NormalError
        title="We're sorry! We could not design your knock out sequence."
        message={LOCAL_OPT_ERROR_MESSAGE}
      />
    );
  }
  return (
    <div className="flex flex-col gap-2 p-4 border rounded-md border-primary">
      {designedSequence ? (
        <DesignedSequence
          inputSequence={props.sequence}
          designedSequence={designedSequence}
        ></DesignedSequence>
      ) : (
        <DesignNotDone
          startTimestamp={startTimestamp}
          currentMutation={progressData.currentMutation}
        ></DesignNotDone>
      )}
      <DesignIterationsTable
        iterations={progressData.iterations}
      ></DesignIterationsTable>
    </div>
  );
}
