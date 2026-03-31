import { useMemo, useState } from "react";
import { DesignIterationsTable } from "@/components/designIterationsTable";
import useGenerateKOEndpoint from "./hook";
import useFeaturizeEndpoint from "../featurize/hook";
import type { Featurized } from "../featurize/types";
import TransferList from "@/components/transferList";
import { Button } from "@/components/ui/button";
import { FEATURE_MEANS } from "@/lib/consts";
import { mutationToString } from "@/lib/utils";

type FeatureCard = { propKey: string; selected: boolean; searchKey: string; value: number }
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
        : Object.entries(featureVector).map(([featureID, value]) => ({
            selected: false,
            propKey: featureID,
            searchKey: featureID,
            value,
          }))
    );
  }

  const featureTargets = useMemo(() => {
    if (featureVector === null) return null;
    const KOFeatures = new Set(KOList.map((i) => i.propKey));
    return Object.fromEntries(
      Object.entries(featureVector).map(([id, val]) => [
        id,
        KOFeatures.has(id) ? KOFeatureTargets[id] : val,
      ])
    );
  }, [featureVector, KOList]);
  const [reqTimestamp, setReqTimestamp] = useState(() => Date.now());
  return (
    <>
      {error !== null ? <div>error: {error}</div> : null}
      {featureTargets !== null && featureVector !== null ? (
        <GenerateKOTargetPicker
          disabled={requestStarted}
          featureVector={featureVector}
          KOFeatureTargets={FEATURE_MEANS}
          defaultListState={[defaultList, setDefaultList]}
          KOListState={[KOList, setKOList]}
          featureTargets={featureTargets}
        ></GenerateKOTargetPicker>
      ) : null}
      <Button
        disabled={featureTargets === null}
        value={requestStarted ? "Edit design job" : "Click to design"}
        onClick={() => {
          setRequestStarted(!requestStarted);
          if (!requestStarted) {
            setReqTimestamp(Date.now())
          }
        }}
      ></Button>
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
    </>
  );
}
function checkAllFeatures(data: Record<string, Featurized> | null) {
  if (data === null) {
    return {
      featureVector: null,
      checkError: null,
    };
  }
  const featureVector: Record<string, number> = {};
  for (const [featureID, featurized] of Object.entries(data)) {
    if (featurized.case === "error") {
      return {
        featureVector: null,
        checkError: `Could not compute all features of initial sequence: ${featurized.value.reason}`,
      };
    }
    featureVector[featureID] = featurized.value;
  }
  return {
    featureVector,
    checkError: null,
  };
}
function GenerateKOTargetPicker(props: {
  disabled: boolean;
  KOFeatureTargets: Record<string, number>;
  featureVector: Record<string, number>;
  featureTargets: Record<string, number>;
  defaultListState: [FeatureCard[], (_: FeatureCard[]) => void];
  KOListState: [FeatureCard[], (_: FeatureCard[]) => void] 
}) {
  const {
    disabled,
    featureTargets,
    defaultListState,
    KOListState
  } = props;
  return (
    <TransferList
      disabled={disabled}
      leftListState={defaultListState}
      rightListState={KOListState}
      renderItem={(item, toggleSelect) => (
        <li key={item.propKey}>
          <Button disabled={disabled} onClick={toggleSelect}>
            {item.searchKey}; target={featureTargets[item.propKey]} Selected:{" "}
            {JSON.stringify(item.selected)}
          </Button>
        </li>
      )}
    ></TransferList>
  );
}
function GenerateKOResultsArea(props: {
  sequence: string;
  featureConfiguration: unknown;
  featureWeights: unknown;
  featureTargets: unknown;
  reqTimestamp: number;
}) {
  const { initError, progressData, progressError } =
    useGenerateKOEndpoint(props);
  return (
    <div>
      {initError !== null ? (
        <div>initError: {JSON.stringify(initError)}</div>
      ) : null}
      <span>Done: {JSON.stringify(progressData.done)}</span>
      {progressData.currentMutation !== null && <span>Current Mutation: {mutationToString(progressData.currentMutation)}</span>}
      <DesignIterationsTable
        data={progressData.iterations}
      ></DesignIterationsTable>
      {progressError !== null ? (
        <div>progressError: {JSON.stringify(progressError)}</div>
      ) : null}
    </div>
  );
}
