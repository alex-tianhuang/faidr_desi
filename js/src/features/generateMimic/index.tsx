import { useMemo, useState } from "react";
import useGenerateMimicEndpoint from "./hook";
import RngPicker from "@/components/rngPicker";
import { Button } from "@/components/ui/button";
import { DesignIterationsTable } from "@/components/designIterationsTable";
import { mutationToString } from "@/lib/utils";

export default function GenerateMimicArea(props: {
  sequence: string;
  featureConfiguration: unknown;
  featureWeights: unknown;
  requestStartedState: [boolean, (_: boolean) => void];
}) {
  const {
    sequence,
    featureConfiguration,
    featureWeights,
    requestStartedState: [requestStarted, setRequestStarted],
  } = props;
  const [rngSeed, setRngSeed] = useState(
    // an arbitrary number which is
    // immediately overwritten by RngPicker
    2222,
  );
  const [reqTimestamp, setReqTimestamp] = useState(() => Date.now());
  const rng = useMemo(() => ({ seed: rngSeed }), [rngSeed]);
  return (
    <div className="flex flex-col">
      <RngPicker timestamp={reqTimestamp} disabled={requestStarted} setRngSeed={setRngSeed}></RngPicker>
      <Button
        onClick={() => {
          setRequestStarted(true);
          setReqTimestamp(Date.now());
        }}
      >Click to design</Button>
      <Button
        disabled={!requestStarted}
        onClick={() => {
          setRequestStarted(false);
        }}
      >Edit design job</Button>
      {requestStarted ? (
        <GenerateMimicResultsArea
          sequence={sequence}
          featureConfiguration={featureConfiguration}
          featureWeights={featureWeights}
          rng={rng}
          reqTimestamp={reqTimestamp}
        ></GenerateMimicResultsArea>
      ) : (
        <>Design results will appear here.</>
      )}
    </div>
  );
}
function GenerateMimicResultsArea(props: {
  sequence: string;
  featureConfiguration: unknown;
  featureWeights: unknown;
  rng: {
    seed: number;
  };
  reqTimestamp: number;
}) {
  const { initError, progressData, progressError } =
    useGenerateMimicEndpoint(props);
  return (
    <div>
      <span>Rng: {props.rng.seed}</span>
      {initError !== null ? <div>initError: {JSON.stringify(initError)}</div> : null}
      {progressData.currentMutation !== null && <span>Current Mutation: {mutationToString(progressData.currentMutation)}</span>}
      <span>Done: {JSON.stringify(progressData.done)}</span>
      <DesignIterationsTable data={progressData.iterations}></DesignIterationsTable>
      {progressError !== null ? <div>progressError: {JSON.stringify(progressError)}</div> : null}
    </div>
  );
}