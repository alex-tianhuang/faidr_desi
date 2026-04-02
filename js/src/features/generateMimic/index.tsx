import { useMemo, useState } from "react";
import useGenerateMimicEndpoint from "./hook";
import RngPicker from "@/components/rngPicker";
import { Button } from "@/components/ui/button";
import { DesignIterationsTable } from "@/components/designIterationsTable";
import {
  checkAllFeatures,
  formatTimeElapsed,
  mutationToString,
} from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { LoaderPinwheelIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import FinalSequenceDiv from "@/components/finalSequenceDiv";
import ErrorDiv from "@/components/errorDiv";
import { FEATURE_CONFIGURATION, NUM_FEATURES } from "@/lib/consts";
import useFeaturizeEndpoint from "../featurize/hook";

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
  const [rngHint, setRngHint] = useState("");
  const usingTimestampForRng = Number.isNaN(Number.parseInt(rngHint));
  const rng = useMemo(() => ({ seed: rngSeed }), [rngSeed]);
  const { initError, featurized, featurizedError } = useFeaturizeEndpoint({
    sequence,
    featureConfiguration: FEATURE_CONFIGURATION,
  });
  const { checkError } = useMemo(
    () => checkAllFeatures(featurized),
    [featurized],
  );
  const error = initError || featurizedError || checkError;
  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <GenerateMimicHeader expanded={false} />
        <ErrorDiv
          title="Unfortunately, we cannot design mimics of your inputted sequence."
          message={`Some sequence features could not be computed: ${error}`}
        />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <GenerateMimicHeader expanded={true} />
      <RngPicker
        timestamp={reqTimestamp}
        disabled={requestStarted}
        setRngSeed={setRngSeed}
        rngHintState={[rngHint, setRngHint]}
      ></RngPicker>
      <Alert>
        {usingTimestampForRng
          ? "Using timestamp to seed RNG"
          : `Using "${rng.seed}" to seed RNG`}
      </Alert>
      <Button
        onClick={() => {
          setRequestStarted(!requestStarted);
          !requestStarted && setReqTimestamp(Date.now());
        }}
      >
        {requestStarted
          ? "Go back to editing sequence or RNG seed"
          : "Click to design"}
      </Button>

      {requestStarted ? (
        <>
          <Button
            disabled={!usingTimestampForRng}
            onClick={() => {
              usingTimestampForRng && setReqTimestamp(Date.now());
            }}
          >
            Use a new timestamp to seed RNG
          </Button>
          <GenerateMimicResultsArea
            sequence={sequence}
            featureConfiguration={featureConfiguration}
            featureWeights={featureWeights}
            rng={rng}
            reqTimestamp={reqTimestamp}
          ></GenerateMimicResultsArea>
        </>
      ) : (
        <>Design results will appear here.</>
      )}
    </div>
  );
}
function GenerateMimicHeader(props: { expanded: boolean }) {
  const { expanded } = props;
  return (
    <div className="flex flex-col border rounded-sm px-4 py-3 gap-2">
      <p className="text-xl font-bold text-center pb-2">
        Designing a "feature mimic"
      </p>
      <p>
        {`Use this program to design a sequence that matches ${NUM_FEATURES} sequence features of your inputted sequence. `}
        In other words, it "mimics" the features of your input sequence.
        {expanded && (
          <p>
            Optionally select an RNG seed to deterministically generate an
            initial random sequence, and then click the button at the bottom to
            get your sequence!
          </p>
        )}
      </p>
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
  const { initError, progressData, progressError, startTimestamp } =
    useGenerateMimicEndpoint(props);
  const error = initError ?? progressError;

  const finalSequence =
    (progressData.done ? progressData.iterations.at(-1)?.sequence : null) ??
    null;

  return (
    <div className="flex flex-col gap-2">
      {finalSequence ? (
        <FinalSequenceDiv sequence={finalSequence}></FinalSequenceDiv>
      ) : error ? (
        <ErrorDiv title="Could not design sequence:" message={error}></ErrorDiv>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <HugeiconsIcon
            icon={LoaderPinwheelIcon}
            className="h-4 w-4 animate-spin"
          ></HugeiconsIcon>
          [{formatTimeElapsed(Date.now() - startTimestamp)}]{" "}
          {progressData.currentMutation
            ? `Trying ${mutationToString(progressData.currentMutation)}...`
            : "Starting..."}
        </div>
      )}
      <span className="text-xs text-muted-foreground">
        Used RNG seed: {props.rng.seed}
      </span>

      {progressData.iterations.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            Show all iterations ({progressData.iterations.length - 1})
          </summary>
          <div className="mt-2">
            <DesignIterationsTable data={progressData.iterations} />
          </div>
        </details>
      )}
    </div>
  );
}
