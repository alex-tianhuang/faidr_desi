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
  percentIdentity,
} from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import FinalSequenceDiv from "@/components/finalSequenceDiv";
import ErrorDiv from "@/components/errorDiv";
import { FEATURE_CONFIGURATION, NUM_FEATURES, type IDRome } from "@/lib/consts";
import useFeaturizeEndpoint from "../featurize/hook";
import Loading from "@/components/loading";
import IdromePicker from "@/components/idromePicker";
import UnexpectedError from "@/components/unexpectedError";

export default function GenerateMimicArea(props: {
  sequence: string;
  featureConfiguration: unknown;
  featureWeights: Record<string, number>;
  requestStartedState: [boolean, (_: boolean) => void];
  idromeState: [IDRome, (_: IDRome) => void];
}) {
  const {
    sequence,
    featureConfiguration,
    featureWeights,
    requestStartedState: [requestStarted, setRequestStarted],
    idromeState,
  } = props;
  const [reqTimestamp, setReqTimestamp] = useState(() => Date.now());
  const [rngHint, setRngHint] = useState("");
  const rngInfo = parseRngHint(rngHint, reqTimestamp);
  const { rngSeed } = rngInfo;
  const rng = { seed: rngSeed };
  const { initError, featurized, featurizedError } = useFeaturizeEndpoint({
    sequence,
    featureConfiguration: FEATURE_CONFIGURATION,
  });
  const { checkError } = useMemo(
    () => checkAllFeatures(featurized),
    [featurized],
  );
  if (checkError) {
    return (
      <div className="flex flex-col gap-2">
        <GenerateMimicHeader />
        <ErrorDiv
          title="Unfortunately, we cannot design mimics of your inputted sequence."
          message={`Some sequence features could not be computed: ${checkError}`}
        />
      </div>
    );
  }
  const error = initError ?? featurizedError;
  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <UnexpectedError
          while="computing sequence features of your input sequence"
          error={error}
        ></UnexpectedError>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <GenerateMimicHeader />
      <IdromePicker
        disabled={requestStarted}
        forKO={false}
        idromeState={idromeState}
      ></IdromePicker>
      <GenerateMimicSubmissionArea
        disabled={requestStarted}
        rngHintState={[rngHint, setRngHint]}
        rngSeed={rngSeed}
      ></GenerateMimicSubmissionArea>
      <Button
        onClick={() => {
          setRequestStarted(!requestStarted);
          !requestStarted && setReqTimestamp(Date.now());
        }}
      >
        {requestStarted
          ? "Go back to editing sequence or other parameters"
          : "Click to design"}
      </Button>

      {requestStarted ? (
        <>
          <GenerateMimicResultsArea
            sequence={sequence}
            featureConfiguration={featureConfiguration}
            featureWeights={featureWeights}
            rng={rng}
            reqTimestamp={reqTimestamp}
          ></GenerateMimicResultsArea>
        </>
      ) : (
        <div className="p-4 border rounded-md border-input text-muted-foreground">
          Click the button above and design results will be displayed here.
        </div>
      )}
    </div>
  );
}
function GenerateMimicHeader() {
  return (
    <div className="flex flex-col border rounded-md p-4 gap-2">
      <p className="text-xl font-bold text-center">
        Designing a "feature mimic"
      </p>
      <p className="text-justify text-muted-foreground">
        {`Use this program to design a sequence that matches ${NUM_FEATURES} sequence features of your inputted sequence. `}
        In other words, it "mimics" the features of your input sequence.
      </p>
    </div>
  );
}
function GenerateMimicSubmissionArea(props: {
  disabled: boolean;
  rngHintState: [string, (_: string) => void];
  rngSeed: number;
}) {
  const {
    disabled,
    rngHintState: [rngHint, setRngHint],
    rngSeed,
  } = props;
  const rngInfo = parseRngHint(rngHint, 0);
  const rngSeedDescription = rngInfo.usingTimestampForRng
    ? rngHint.length === 0
      ? "Using timestamp to seed RNG"
      : `Could not parse "${rngHint}" as a number, using timestamp to seed RNG`
    : rngInfo.overflow
      ? `User seed overflows 2 ^ 32, using ${rngSeed} to seed RNG instead (first 32 bits)`
      : rngInfo.underflow
        ? `User seed is negative, using ${rngSeed} to seed RNG instead (modulo 2 ^ 32)`
        : `Using ${rngSeed} to seed RNG`;
  return (
    <div
      className={cn(
        "flex flex-col gap-2 border rounded-md p-4",
        disabled ? "border-input" : "border-primary",
      )}
    >
      <details>
        <summary className="text-sm cursor-pointer text-muted-foreground hover:text-foreground">
          Seed deterministically (advanced)
        </summary>
        <div className="mt-2 flex flex-col gap-2 p-4 border rounded-md border-input">
          <span className="flex-1 text-start text-md font-bold underline">
            RNG Seed
          </span>
          <span className="text-muted-foreground">
            You can input your own seed for the RNG or click the button on the
            right to generate an example seed. If you do nothing, the current
            time will be used to generate a seed for you.
          </span>
          <RngPicker
            disabled={disabled}
            rngHintState={[rngHint, setRngHint]}
          ></RngPicker>
          <Alert>{rngSeedDescription}</Alert>
        </div>
      </details>
    </div>
  );
}
function GenerateMimicResultsArea(props: {
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
  const finalSequence =
    (progressData.done ? progressData.iterations.at(-1)?.sequence : null) ??
    null;

  return (
    <div className="flex flex-col gap-2 p-4 border rounded-md border-primary">
      {finalSequence ? (
        <div className="flex flex-col border border-input rounded-md p-4 gap-2">
          <span className="text-md font-bold underline">Designed Sequence</span>
          <FinalSequenceDiv sequence={finalSequence}></FinalSequenceDiv>
          <div className="flex flex-row items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {percentIdentity(finalSequence, props.sequence).toFixed(1)}%
              identity to user input sequence
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">
              {percentIdentity(
                finalSequence,
                progressData.iterations[0].sequence,
              ).toFixed(1)}
              % identity to random initial sequence
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">
              {percentIdentity(
                props.sequence,
                progressData.iterations[0].sequence,
              ).toFixed(1)}
              % identity between random initial sequence and user input sequence
            </span>
          </div>
        </div>
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
function parseRngHint(rngHint: string, timestamp: number) {
  const rngHintParsed = Number.parseInt(rngHint);
  const usingTimestampForRng = Number.isNaN(rngHintParsed);
  const maxInt = 2 ** 32;
  if (usingTimestampForRng) {
    return {
      usingTimestampForRng: true as const,
      rngSeed: timestamp % maxInt,
    };
  }
  const overflow = rngHintParsed >= maxInt;
  const underflow = rngHintParsed < 0;
  const rngSeed = ((rngHintParsed % maxInt) + maxInt) % maxInt;
  return {
    usingTimestampForRng: false as const,
    rngSeed,
    overflow,
    underflow,
  };
}
