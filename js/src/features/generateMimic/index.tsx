import { useMemo, useState } from "react";
import useGenerateMimicEndpoint from "./hook";
import RngPicker from "@/components/rngPicker";
import { Button } from "@/components/ui/button";
import { DesignIterationsTable } from "@/components/designIterationsTable";
import {
  checkAllFeatures,
  cn,
  formatTimeElapsed,
  mutationToString,
} from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import FinalSequenceDiv from "@/components/finalSequenceDiv";
import ErrorDiv from "@/components/errorDiv";
import { FEATURE_CONFIGURATION, NUM_FEATURES } from "@/lib/consts";
import useFeaturizeEndpoint from "../featurize/hook";
import Loading from "@/components/loading";

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
  const error = initError ?? featurizedError ?? checkError;
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
      <GenerateMimicSubmissionArea
        reqTimestamp={reqTimestamp}
        disabled={requestStarted}
        rngHintState={[rngHint, setRngHint]}
        rngSeedState={[rngSeed, setRngSeed]}
      ></GenerateMimicSubmissionArea>
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
        <span className="text-muted-foreground">
          Design results will be displayed below.
        </span>
      )}
    </div>
  );
}
function GenerateMimicHeader(props: { expanded: boolean }) {
  const { expanded } = props;
  return (
    <>
      <div className="flex flex-col border rounded-md px-4 py-3 gap-2">
        <p className="text-xl font-bold text-center pb-2">
          Designing a "feature mimic"
        </p>
        <p className="text-justify text-muted-foreground">
          {`Use this program to design a sequence that matches ${NUM_FEATURES} sequence features of your inputted sequence. `}
          In other words, it "mimics" the features of your input sequence.
        </p>
      </div>
      {expanded && (
        <div className="flex flex-col border rounded-md text-justify text-muted-foreground px-4 py-3 gap-2">
          <p className="text-foreground text-md font-bold underline">
            Instructions
          </p>
          <p>
            Optionally select an RNG seed to deterministically generate an
            initial random sequence.
          </p>
          <p>
            Click the button at the bottom to get a new sequence that matches
            the features of your input sequence!
          </p>
        </div>
      )}
    </>
  );
}
function GenerateMimicSubmissionArea(props: {
  reqTimestamp: number;
  disabled: boolean;
  rngHintState: [string, (_: string) => void];
  rngSeedState: [number, (_: number) => void];
}) {
  const {
    reqTimestamp,
    disabled,
    rngHintState: [rngHint, setRngHint],
    rngSeedState: [rngSeed, setRngSeed],
  } = props;
  const rngHintParsed = Number.parseInt(rngHint);
  const usingTimestampForRng = Number.isNaN(rngHintParsed);
  const rngSeedDescription = usingTimestampForRng
    ? rngHint.length === 0
      ? "Using timestamp to seed RNG"
      : `Could not parse "${rngHint}" as a number, using timestamp to seed RNG`
    : rngHintParsed >= 2 ** 32
      ? `User seed overflows 2 ^ 32, using ${rngHintParsed % 2 ** 32} to seed RNG instead (first 32 bits)`
      : `Using ${rngSeed} to seed RNG`;
  return (
    <div
      className={cn(
        "flex flex-col gap-2 border rounded-md px-3 py-4",
        disabled ? "border-input" : "border-primary",
      )}
    >
      <RngPicker
        timestamp={reqTimestamp}
        disabled={disabled}
        setRngSeed={setRngSeed}
        rngHintState={[rngHint, setRngHint]}
      ></RngPicker>
      <Alert>{rngSeedDescription}</Alert>
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
          <Loading>
            [{formatTimeElapsed(Date.now() - startTimestamp)}]{" "}
            {progressData.currentMutation
              ? `Trying ${mutationToString(progressData.currentMutation)}...`
              : "Starting..."}
          </Loading>
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
