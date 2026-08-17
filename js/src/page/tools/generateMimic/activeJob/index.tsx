import useGenerateMimicEndpoint from "@/backend/apis/generateMimic";
import { UnexpectedError } from "@/components/errors";
import DesignedSequence from "./designedSequence";
import DesignNotDone from "../../../../components/designNotDone";
import { DesignIterationsTable } from "@/components/designIterationsTable";

export default function GenerateMimicActiveJob(props: {
  sequence: string;
  featureConfiguration: unknown;
  featureWeights: Record<string, number>;
  rng: {
    seed: number;
  };
  reqTimestamp: number;
}) {
  const { initError, progressData, progressError, startTimestamp } =
    useGenerateMimicEndpoint(props);
  const error = initError ?? progressError;

  if (error) {
    return (
      <UnexpectedError
        while="designing your feature mimic sequence"
        error={error}
      ></UnexpectedError>
    );
  }
  const designedSequence =
    (progressData.done ? progressData.iterations.at(-1)?.sequence : null) ??
    null;

  return (
    <div className="flex flex-col gap-2 p-4 border rounded-md border-primary">
      {designedSequence ? (
        <DesignedSequence
          inputSequence={props.sequence}
          progressData={progressData}
          designedSequence={designedSequence}
        ></DesignedSequence>
      ) : (
        <DesignNotDone
          currentMutation={progressData.currentMutation}
          startTimestamp={startTimestamp}
        ></DesignNotDone>
      )}
      <span className="text-xs text-muted-foreground">
        Used RNG seed: {props.rng.seed}
      </span>
      <DesignIterationsTable
        iterations={progressData.iterations}
      ></DesignIterationsTable>
    </div>
  );
}
