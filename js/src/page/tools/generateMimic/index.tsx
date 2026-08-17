import { useMemo, useState } from "react";
import RngPicker from "@/page/tools/generateMimic/rngPicker";
import { checkAllFeatures, cn } from "@/lib/utils";
import { NormalError, UnexpectedError } from "@/components/errors";
import { FEATURE_CONFIGURATION, type IDRome } from "@/lib/consts";
import useFeaturizeEndpoint from "@/backend/apis/featurize";
import IdromePicker from "@/components/idromePicker";
import Header from "./header";
import { parseRngHint } from "./utils";
import GenerateMimicActiveJob from "./activeJob";
import { Button } from "@/components/ui/button";

export default function GenerateMimic(props: {
  sequence: string;
  featureConfiguration: unknown;
  featureWeights: Record<string, number>;
  freezeInputsState: [boolean, (_: boolean) => void];
  idromeState: [IDRome, (_: IDRome) => void];
}) {
  const {
    sequence,
    featureConfiguration,
    featureWeights,
    freezeInputsState: [freezeInputs, setFreezeInputs],
    idromeState,
  } = props;
  const [reqTimestamp, setReqTimestamp] = useState(() => Date.now());
  const [rngHint, setRngHint] = useState("");
  const rngInfo = parseRngHint(rngHint, reqTimestamp);
  const { rngSeed } = rngInfo;
  const rng = { seed: rngSeed };
  const { featurizationError, featurized } = useFeaturizeEndpoint({
    sequence,
    featureConfiguration: FEATURE_CONFIGURATION,
  });
  const { checkError } = useMemo(
    () => checkAllFeatures(featurized),
    [featurized],
  );
  if (featurizationError) {
    return (
      <UnexpectedError
        while="computing sequence features of your input sequence"
        error={featurizationError}
      ></UnexpectedError>
    );
  }
  if (checkError) {
    return (
      <NormalError
        title="We're sorry! We cannot design mimics of your inputted sequence."
        message={`Some sequence features could not be computed: ${checkError}`}
      />
    );
  }
  const hasActiveJob = freezeInputs;
  const setActiveJob = setFreezeInputs;
  return (
    <div className="flex flex-col gap-2">
      <Header />
      <IdromePicker
        disabled={freezeInputs}
        forKO={false}
        idromeState={idromeState}
      ></IdromePicker>
      <RngPicker
        disabled={freezeInputs}
        rngHintState={[rngHint, setRngHint]}
        rngSeed={rngSeed}
      ></RngPicker>
      <div
        className={cn(
          "flex flex-col gap-2 p-4 border rounded-md",
          freezeInputs ? "border-input opacity-50" : "border-primary",
        )}
      >
        <p className="font-bold underline">Submit your design job</p>
        <p className="text-muted-foreground">
          Once you have selected your IDRome and input sequence, click the
          button below to get your designed feature mimic sequence.
        </p>
        <Button
          onClick={() => {
            setActiveJob(true);
            setReqTimestamp(Date.now());
          }}
          disabled={freezeInputs}
        >
          Click to design
        </Button>
      </div>
      {hasActiveJob ? (
        <div className="flex flex-col gap-2 p-4 border rounded-md border-primary">
          <Button onClick={() => setActiveJob(false)}>
            Change your design job (go back)
          </Button>
          <GenerateMimicActiveJob
            sequence={sequence}
            featureConfiguration={featureConfiguration}
            featureWeights={featureWeights}
            rng={rng}
            reqTimestamp={reqTimestamp}
          ></GenerateMimicActiveJob>
        </div>
      ) : (
        <div className="p-4 border rounded-md border-input text-muted-foreground">
          Click the button above and design results will be displayed here.
        </div>
      )}
    </div>
  );
}
