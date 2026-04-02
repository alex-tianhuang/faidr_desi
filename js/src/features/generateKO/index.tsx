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
import { LoaderPinwheelIcon } from "@hugeicons/core-free-icons";
import { Alert } from "@/components/ui/alert";

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
              ? `Setting ${numFeaturesKO} features to IDRome average`
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
    <div className="flex flex-col border rounded-sm p-2 px-4 py-3 gap-2">
      <p className="text-xl font-bold text-center pb-2">
        Designing a "feature knockout"
      </p>
      <p>
        {`Use this program to design a sequence that preserves ${NUM_FEATURES} sequence features of your inputted sequence, `}
        but sets some sequence features that you want to ablate to the human
        IDRome average. In other words, it "knocks out" those features.
      </p>
      {expanded && (
        <>
          <p>
            Select features to knockout by clicking on the cards in the left
            list, then click the {"`>>`"} button to move those to the knockout
            list. You can see the original values and IDRome average values on
            the cards on the right list.
          </p>
          <p>
            When you have selected your features, click the button at the bottom
            to get your sequence!
          </p>
        </>
      )}
    </div>
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
    defaultListState,
    KOListState,
  } = props;
  return (
    <div className={cn("flex flex-col", disabled && "opacity-50")}>
      <TransferList
        disabled={disabled}
        leftListState={defaultListState}
        leftListTitle="Features to preserve"
        rightListState={KOListState}
        rightListTitle="Features to set to IDRome average"
        renderItem={(item, toggleSelect, whichList) => (
          <li key={item.propKey}>
            <button
              disabled={disabled}
              onClick={toggleSelect}
              className={cn(
                "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors flex items-center gap-3",
                item.selected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              <span className="flex-1 truncate font-medium">
                {item.searchKey}
              </span>
              <span className="shrink-0 text-xs opacity-70 w-20 text-right tabular-nums">
                {Number(featureVector[item.propKey]).toPrecision(3)}
                {whichList === "right" && (
                  <>
                    {" → "}
                    {Number(KOFeatureTargets[item.propKey]).toPrecision(3)}
                  </>
                )}
              </span>
            </button>
          </li>
        )}
        compareFn={(a: FeatureCard, b: FeatureCard) =>
          compareStrings(a.searchKey, b.searchKey)
        }
      ></TransferList>
    </div>
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
