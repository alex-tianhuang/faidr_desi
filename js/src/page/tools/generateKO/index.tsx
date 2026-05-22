import { useEffect, useMemo, useState } from "react";
import { DesignIterationsTable } from "@/components/designIterationsTable";
import useGenerateKOEndpoint from "@/backend/apis/generateKO";
import useFeaturizeEndpoint from "@/backend/apis/featurize";
import TransferList from "@/page/tools/generateKO/transferList";
import { Button } from "@/components/ui/button";
import { NUM_FEATURES, type IDRome } from "@/lib/consts";
import {
  checkAllFeatures,
  cn,
  compareStrings,
  formatTimeElapsed,
  mutationToString,
  percentIdentity,
} from "@/lib/utils";
import FinalSequenceDiv from "@/components/finalSequenceDiv";
import { NormalError, UnexpectedError } from "@/components/errors";
import { Alert } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronsRight } from "lucide-react";
import Loading from "@/components/loading";
import IdromePicker from "@/components/idromePicker";

type FeatureCard = {
  propKey: string;
  selected: boolean;
  searchKey: string;
  value: number;
};
export default function GenerateKOArea(props: {
  sequence: string;
  featureConfiguration: unknown;
  featureWeights: Record<string, number>;
  KOFeatureTargets: Record<string, number>;
  requestStartedState: [boolean, (_: boolean) => void];
  idromeState: [IDRome, (_: IDRome) => void];
}) {
  const {
    sequence,
    featureConfiguration,
    featureWeights,
    KOFeatureTargets,
    requestStartedState: [requestStarted, setRequestStarted],
    idromeState,
  } = props;
  const { featurizationError, featurized } = useFeaturizeEndpoint({
    sequence,
    featureConfiguration,
  });
  const { featureVector, checkError } = useMemo(
    () => checkAllFeatures(featurized),
    [featurized],
  );
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
  // if numFeaturesKO === 0 then there should be no request
  //
  // on dev this occassionally freezes my component when
  // I go off the page for a little bit for some reason
  useEffect(() => {
    if (numFeaturesKO === 0 && requestStarted) {
      setRequestStarted(false);
    }
  }, [numFeaturesKO]);
  if (checkError) {
    return (
      <div className="flex flex-col gap-2">
        <GenerateKOHeader />
        <NormalError
          title="We're sorry! We cannot design knockouts of your inputted sequence."
          message={`Some sequence features could not be computed: ${checkError}`}
        />
      </div>
    );
  }
  if (featurizationError) {
    return (
      <div className="flex flex-col gap-2">
        <UnexpectedError
          while="computing sequence features of your input sequence"
          error={featurizationError}
        ></UnexpectedError>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <GenerateKOHeader />
      {featureTargets !== null && featureVector !== null ? (
        <>
          <IdromePicker
            disabled={requestStarted}
            forKO={true}
            idromeState={idromeState}
          ></IdromePicker>
          <GenerateKOSubmissionArea
            featureTargets={featureTargets}
            featureVector={featureVector}
            KOFeatureTargets={KOFeatureTargets}
            setReqTimestamp={setReqTimestamp}
            KOListState={[KOList, setKOList]}
            defaultListState={[defaultList, setDefaultList]}
            disabled={requestStarted}
          ></GenerateKOSubmissionArea>
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
          {requestStarted ? (
            <GenerateKOResultsArea
              sequence={sequence}
              featureConfiguration={featureConfiguration}
              featureWeights={featureWeights}
              featureTargets={featureTargets}
              reqTimestamp={reqTimestamp}
            ></GenerateKOResultsArea>
          ) : (
            <div className="p-4 border border-input rounded-md text-muted-foreground">
              {numFeaturesKO > 0
                ? "Click the button above and design results will be displayed here."
                : "Design results will be displayed here once you choose some features to knockout."}
            </div>
          )}
        </>
      ) : (
        <Loading>Computing input sequence's features...</Loading>
      )}
    </div>
  );
}
function GenerateKOHeader() {
  return (
    <>
      <div className="flex flex-col border rounded-md p-4 gap-2">
        <p className="text-xl font-bold text-center">
          Designing a "feature knockout"
        </p>
        <p className="text-justify text-muted-foreground">
          {`Use this program to design a sequence that preserves ${NUM_FEATURES} sequence features of your inputted sequence, `}
          but set some sequence features that you want to ablate to the IDRome
          minimum. In other words, it "knocks out" those features.
        </p>
      </div>
    </>
  );
}
function GenerateKOSubmissionArea(props: {
  disabled: boolean;
  featureVector: Record<string, number>;
  featureTargets: Record<string, number>;
  KOFeatureTargets: Record<string, number>;
  defaultListState: [FeatureCard[], (_: FeatureCard[]) => void];
  KOListState: [FeatureCard[], (_: FeatureCard[]) => void];
  setReqTimestamp: (_: number) => void;
}) {
  const {
    disabled,
    featureTargets,
    featureVector,
    KOFeatureTargets,
    defaultListState,
    KOListState: [KOList, setKOList],
  } = props;
  const numFeaturesKO = KOList.length;
  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-4 border rounded-md",
        disabled ? "border-input" : "border-primary",
      )}
    >
      <p className="text-left text-foreground text-md font-bold underline">
        Pick features to knockout
      </p>
      <div className="flex flex-col text-justify text-muted-foreground gap-2">
        <p>
          About the two lists below: the list on the left is the list of
          features to be preserved in your sequence, and the list on the right
          is the list of features to set to IDRome minimum.
        </p>
        <p>
          Pick features to knockout by clicking on the cards in the left list,
          then click the {<ChevronsRight className="inline" />} button to move
          those to the right list.
        </p>
        <p>
          In the list on the right, each of the cards should display the
          original feature value and the intended target value in the format
          "(original value) → (IDRome minimum value)".
        </p>
      </div>

      <GenerateKOTargetPicker
        disabled={disabled}
        featureVector={featureVector}
        KOFeatureTargets={KOFeatureTargets}
        defaultListState={defaultListState}
        KOListState={[KOList, setKOList]}
        featureTargets={featureTargets}
      ></GenerateKOTargetPicker>
      <Alert>
        {numFeaturesKO > 0
          ? `Setting ${numFeaturesKO} feature${numFeaturesKO > 1 ? "s" : ""} to IDRome minimum`
          : "Please choose at least one feature to knockout (set to IDRome minimum)"}
      </Alert>
      {numFeaturesKO > 0 && (
        <div className="text-muted-foreground">
          Once you have done selected your features to knockout, click the
          button below to get your designed knockout sequence!
        </div>
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
  const onlyOneItemSelected = useMemo(
    () =>
      !userProbablyNeedsHint &&
      KOList.length === 0 &&
      defaultList.filter((item) => item.selected).length === 1,
    [userProbablyNeedsHint, defaultList, KOList],
  );
  const [overrideLeftChevronTooltip, setOverrideLeftChevronTooltip] =
    useState(false);
  return (
    <div className={cn("flex flex-col", disabled && "opacity-50")}>
      <TransferList
        disabled={disabled}
        leftListState={[defaultList, setDefaultList]}
        leftListTitle="Features to preserve"
        rightListState={[KOList, setKOList]}
        rightListTitle="Features to set to IDRome minimum"
        renderItem={(item, toggleSelect, whichList) => (
          <li key={item.propKey}>
            <GenerateKOFeatureCard
              disabled={disabled}
              toggleSelect={() => {
                if (!item.selected && userProbablyNeedsHint) {
                  setOverrideLeftChevronTooltip(true);
                }
                if (item.selected && onlyOneItemSelected) {
                  setOverrideLeftChevronTooltip(false);
                }
                toggleSelect();
              }}
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
        overrideLeftChevronTooltipState={[
          overrideLeftChevronTooltip,
          setOverrideLeftChevronTooltip,
        ]}
      ></TransferList>
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
      <TooltipContent>Click me to select me for knockout!</TooltipContent>
    </Tooltip>
  );
}
function GenerateKOResultsArea(props: {
  sequence: string;
  featureConfiguration: unknown;
  featureWeights: Record<string, number>;
  featureTargets: Record<string, number>;
  reqTimestamp: number;
}) {
  const { initError, progressData, progressError, startTimestamp } =
    useGenerateKOEndpoint(props);
  const finalSequence =
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
  const LOCAL_OPT_ERROR_MESSAGE =
    "Starting sequence is already at local optimum in feature space. This can happen when too few features are allowed to vary and the system becomes overconstrained. We recommend choosing more or different features to knockout.";
  return (
    <div className="flex flex-col gap-2 p-4 border rounded-md border-primary">
      {localOptError ? (
        <NormalError
          title="We're sorry! We could not design your knock out sequence."
          message={LOCAL_OPT_ERROR_MESSAGE}
        />
      ) : finalSequence ? (
        <div className="flex flex-col border border-input rounded-md p-4 gap-2">
          <span className="text-md font-bold underline">Designed Sequence</span>
          <FinalSequenceDiv sequence={finalSequence}></FinalSequenceDiv>
          <span className="text-sm text-muted-foreground">
            {percentIdentity(finalSequence, props.sequence).toFixed(1)}%
            identity to user input sequence
          </span>
        </div>
      ) : (
        <Loading>
          [{formatTimeElapsed(Date.now() - startTimestamp)}]{" "}
          {progressData.currentMutation
            ? `Trying ${mutationToString(progressData.currentMutation)}...`
            : "Starting..."}
        </Loading>
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
