import useGenerateKOEndpoint from "@/backend/apis/generateKO";
import { NormalError, UnexpectedError } from "@/components/errors";
import DesignedSequence from "./designedSequence";
import DesignNotDone from "@/components/designNotDone";
import { DesignIterationsTable } from "@/components/designIterationsTable";
import DesignedSequenceFeatures from "./designedSequenceFeatures";
import type { IDRome } from "@/lib/consts";

export default function GenerateKOActiveJob(props: {
  sequence: string;
  featureConfiguration: unknown;
  initialFeatureVector: Record<string, number>;
  KOFeatureTargets: Record<string, number>;
  featureWeights: Record<string, number>;
  featureTargets: Record<string, number>;
  reqTimestamp: number;
  idrome: IDRome;
}) {
  const {
    initialFeatureVector,
    featureConfiguration,
    KOFeatureTargets,
    featureTargets,
    idrome,
  } = props;
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
    <>
      {designedSequence ? (
        <>
          <DesignedSequence
            inputSequence={props.sequence}
            designedSequence={designedSequence}
          ></DesignedSequence>
          <DesignedSequenceFeatures
            initialFeatureVector={initialFeatureVector}
            designedSequence={designedSequence}
            featureConfiguration={featureConfiguration}
            KOFeatureTargets={KOFeatureTargets}
            featureTargets={featureTargets}
            idrome={idrome}
          ></DesignedSequenceFeatures>
        </>
      ) : (
        <DesignNotDone
          startTimestamp={startTimestamp}
          currentMutation={progressData.currentMutation}
        ></DesignNotDone>
      )}

      <DesignIterationsTable
        iterations={progressData.iterations}
      ></DesignIterationsTable>
    </>
  );
}
