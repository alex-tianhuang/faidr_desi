import { useMemo, useState } from "react";
import useGenerateMimicEndpoint from "./hook";
import RngPicker from "@/components/rngPicker";
import { Button } from "@/components/ui/button";
import { DesignIterationsTable } from "@/components/designIterationsTable";

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
    <>
      <RngPicker timestamp={reqTimestamp} disabled={requestStarted} setRngSeed={setRngSeed}></RngPicker>
      <Button
        value="Click to design"
        onClick={() => {
          setRequestStarted(true);
          setReqTimestamp(Date.now());
        }}
      ></Button>
      <Button
        disabled={!requestStarted}
        value="Edit design job"
        onClick={() => {
          setRequestStarted(false);
        }}
      ></Button>
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
    </>
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
      <span>Done: {JSON.stringify(progressData.done)}</span>
      <DesignIterationsTable data={progressData.iterations}></DesignIterationsTable>
      {progressError !== null ? <div>progressError: {JSON.stringify(progressError)}</div> : null}
    </div>
  );
}