import { useEffect, useMemo, useState } from "react";
import { DesignIterationsTable } from "@/components/designIterationsTable";
import useGenerateKOEndpoint from "./hook";
import useFeaturizeEndpoint from "../featurize/hook";
import TransferList from "@/components/transferList";
import { Button } from "@/components/ui/button";
import { FEATURE_MEANS, NUM_FEATURES } from "@/lib/consts";
import {
  checkAllFeatures,
  cn,
  compareStrings,
  formatTimeElapsed,
  mutationToString,
} from "@/lib/utils";
import FinalSequenceDiv from "@/components/finalSequenceDiv";
import ErrorDiv from "@/components/errorDiv";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChevronsRight, LoaderPinwheelIcon } from "@hugeicons/core-free-icons";
import { Alert } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type FeatureCard = {
  propKey: string;
  selected: boolean;
  searchKey: string;
  value: number;
};
export default function GenerateKOArea(props: {
  sequence: string;
  featureConfiguration: unknown;
  featureWeights: unknown;
  KOFeatureTargets: Record<string, number>;
  requestStartedState: [boolean, (_: boolean) => void];
}) {
  const {
    sequence,
    featureConfiguration,
    featureWeights,
    KOFeatureTargets,
    requestStartedState: [requestStarted, setRequestStarted],
  } = props;
  const { initError, featurized, featurizedError } = useFeaturizeEndpoint({
    sequence,
    featureConfiguration,
  });
  const { featureVector, checkError } = useMemo(
    () => checkAllFeatures(featurized),
    [featurized],
  );
  const error = initError ?? featurizedError ?? checkError;

  const [defaultList, setDefaultList] = useState<FeatureCard[]>([]);
  const [KOList, setKOList] = useState<FeatureCard[]>([]);
  const [prevFeatureVector, setPrevFeatureVector] = useState(featureVector);

  if (prevFeatureVector !== featureVector) {
    setPrevFeatureVector(featureVector);
    setKOList([]);
    setDefaultList(
      featureVector === null
        ? []
        : Object.entries(featureVector)
            .map(([featureID, value]) => ({
              selected: false,
              propKey: featureID,
              searchKey: featureID,
              value,
            }))
            .sort((a, b) => compareStrings(a.searchKey, b.searchKey)),
    );
  }

  const featureTargets = useMemo(() => {
    if (featureVector === null) return null;
    const KOFeatures = new Set(KOList.map((i) => i.propKey));
    return Object.fromEntries(
      Object.entries(featureVector).map(([id, val]) => [
        id,
        KOFeatures.has(id) ? KOFeatureTargets[id] : val,
      ]),
    );
  }, [featureVector, KOList]);
  const [reqTimestamp, setReqTimestamp] = useState(() => Date.now());
  const numFeaturesKO = KOList.length;
  useEffect(() => {
    if (numFeaturesKO === 0 && requestStarted) {
      setRequestStarted(false);
    }
  }, [numFeaturesKO]);
  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <GenerateKOHeader expanded={false} />
        <ErrorDiv
          title="Unfortunately, we cannot design knockouts of your inputted sequence."
          message={`Some sequence features could not be computed: ${error}`}
        />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <GenerateKOHeader expanded={true} />
      {featureTargets !== null && featureVector !== null ? (
        <>
          <GenerateKOTargetPicker
            disabled={requestStarted}
            featureVector={featureVector}
            KOFeatureTargets={FEATURE_MEANS}
            defaultListState={[defaultList, setDefaultList]}
            KOListState={[KOList, setKOList]}
            featureTargets={featureTargets}
          ></GenerateKOTargetPicker>
          <Alert>
            {numFeaturesKO > 0
              ? `Setting ${numFeaturesKO} feature${numFeaturesKO > 1 ? "s" : ""} to IDRome average`
              : "Please choose at least one feature to knockout (set to IDRome average)"}
          </Alert>
          <Button
            disabled={numFeaturesKO === 0}
            onClick={() => {
              setRequestStarted(!requestStarted);
              !requestStarted && setReqTimestamp(Date.now());
            }}
          >
            {requestStarted
              ? "Go back to editing sequence or features to knockout"
              : "Click to design"}
          </Button>
        </>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <HugeiconsIcon
            icon={LoaderPinwheelIcon}
            className="h-4 w-4 animate-spin"
          ></HugeiconsIcon>
          Computing input sequence's features...
        </div>
      )}
      {requestStarted ? (
        <GenerateKOResultsArea
          sequence={sequence}
          featureConfiguration={featureConfiguration}
          featureWeights={featureWeights}
          featureTargets={featureTargets}
          reqTimestamp={reqTimestamp}
        ></GenerateKOResultsArea>
      ) : (
        <>Design results will appear here.</>
      )}
    </div>
  );
}
function GenerateKOHeader(props: { expanded: boolean }) {
  const { expanded } = props;
  return (
    <>
      <div className="flex flex-col border rounded-sm p-2 px-4 py-3 gap-2">
        <p className="text-xl font-bold text-center pb-2">
          Designing a "feature knockout"
        </p>
        <p>
          {`Use this program to design a sequence that preserves ${NUM_FEATURES} sequence features of your inputted sequence, `}
          but sets some sequence features that you want to ablate to the human
          IDRome average. In other words, it "knocks out" those features.
        </p>
      </div>
      {expanded && (
        <div className="flex flex-col border rounded-sm p-2 px-4 py-3 gap-2">
          <p className="text-md font-bold underline">Instructions</p>
          <p>
            Select features to knockout by clicking on the cards in the left
            list, then click the{" "}
            {
              <HugeiconsIcon
                className="inline"
                icon={ChevronsRight}
              ></HugeiconsIcon>
            }{" "}
            button to move those to the knockout list.
          </p>
          <p>
            You can see the pairs of "(original value) → (IDRome average value)"
            on the cards on the right list.
          </p>
          <p>
            When you have selected your features, click the button at the bottom
            to get a sequence that sets your selected features to IDRome
            average!
          </p>
        </div>
      )}
    </>
  );
}
function GenerateKOTargetPicker(props: {
  disabled: boolean;
  KOFeatureTargets: Record<string, number>;
  featureVector: Record<string, number>;
  featureTargets: Record<string, number>;
  defaultListState: [FeatureCard[], (_: FeatureCard[]) => void];
  KOListState: [FeatureCard[], (_: FeatureCard[]) => void];
}) {
  const {
    disabled,
    featureVector,
    KOFeatureTargets,
    defaultListState: [defaultList, setDefaultList],
    KOListState: [KOList, setKOList],
  } = props;
  // user hasn't clicked anything and might not understand these are buttons
  const userProbablyNeedsHint = useMemo(
    () =>
      KOList.length === 0 &&
      defaultList.findIndex((item) => item.selected) === -1,
    [defaultList, KOList],
  );
  return (
    <div className={cn("flex flex-col", disabled && "opacity-50")}>
      <TooltipProvider delay={1000}>
        <TransferList
          disabled={disabled}
          leftListState={[defaultList, setDefaultList]}
          leftListTitle="Features to preserve"
          rightListState={[KOList, setKOList]}
          rightListTitle="Features to set to IDRome average"
          renderItem={(item, toggleSelect, whichList) => (
            <li key={item.propKey}>
              <GenerateKOFeatureCard
                disabled={disabled}
                toggleSelect={toggleSelect}
                selected={item.selected}
                featureID={item.propKey}
                isKOList={whichList === "right"}
                featureVector={featureVector}
                KOFeatureTargets={KOFeatureTargets}
                userProbablyNeedsHint={userProbablyNeedsHint}
              />
            </li>
          )}
          compareFn={(a: FeatureCard, b: FeatureCard) =>
            compareStrings(a.searchKey, b.searchKey)
          }
        ></TransferList>
      </TooltipProvider>
    </div>
  );
}
function GenerateKOFeatureCard(props: {
  disabled: boolean;
  toggleSelect: () => void;
  selected: boolean;
  featureID: string;
  isKOList: boolean;
  featureVector: Record<string, number>;
  KOFeatureTargets: Record<string, number>;
  userProbablyNeedsHint: boolean;
}) {
  const {
    disabled,
    toggleSelect,
    selected,
    featureID,
    isKOList,
    featureVector,
    KOFeatureTargets,
    userProbablyNeedsHint,
  } = props;
  return (
    <Tooltip>
      <TooltipTrigger disabled={!userProbablyNeedsHint} className="w-full">
        <Button
          disabled={disabled}
          onClick={toggleSelect}
          className="items-center gap-3 w-full text-sm rounded-sm"
          variant={selected ? "default" : "outline"}
        >
          <span className="flex-1 truncate font-medium self-left text-left">
            {featureID}
          </span>
          <span className="shrink-0 text-xs opacity-70 text-right self-right">
            {Number(featureVector[featureID]).toPrecision(3)}
            {isKOList && (
              <>
                {" → "}
                {Number(KOFeatureTargets[featureID]).toPrecision(3)}
              </>
            )}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Click me to select me!</TooltipContent>
    </Tooltip>
  );
}
function GenerateKOResultsArea(props: {
  sequence: string;
  featureConfiguration: unknown;
  featureWeights: unknown;
  featureTargets: unknown;
  reqTimestamp: number;
}) {
  const { initError, progressData, progressError, startTimestamp } =
    useGenerateKOEndpoint(props);
  const finalSequence =
    (progressData.done ? progressData.iterations.at(-1)?.sequence : null) ??
    null;
  const checkError =
    progressData?.done && progressData.iterations.length === 1
      ? "Starting sequence is already at local optimum in feature space.\nThis can happen when too few features are allowed to vary and the system becomes overconstrained.\nWe recommend choosing more or different features to knockout."
      : null;
  const error = initError ?? progressError ?? checkError;
  return (
    <div className="flex flex-col gap-2">
      {error ? (
        <ErrorDiv title="Could not design sequence:" message={error}></ErrorDiv>
      ) : finalSequence ? (
        <FinalSequenceDiv sequence={finalSequence}></FinalSequenceDiv>
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
