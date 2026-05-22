import { useEffect, useMemo, useState } from "react";
import useFeaturizeEndpoint from "@/backend/apis/featurize";
import { type IDRome } from "@/lib/consts";
import {
  checkAllFeatures,
  compareStrings,
} from "@/lib/utils";
import { NormalError, UnexpectedError } from "@/components/errors";
import Loading from "@/components/loading";
import IdromePicker from "@/components/idromePicker";
import Header from "./header";
import BackButton from "@/components/backButton";
import SubmitButton from "@/components/submitButton";
import GenerateKOActiveJob from "./activeJob";
import type { FeatureCardData } from "@/types/generateKO";
import FeatureKOPicker from "./featureKOPicker";

export default function GenerateKOArea(props: {
  sequence: string;
  featureConfiguration: unknown;
  featureWeights: Record<string, number>;
  KOFeatureTargets: Record<string, number>;
  freezeInputsState: [boolean, (_: boolean) => void];
  idromeState: [IDRome, (_: IDRome) => void];
}) {
  const {
    sequence,
    featureConfiguration,
    featureWeights,
    KOFeatureTargets,
    freezeInputsState: [freezeInputs, setFreezeInputs],
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
  const [defaultList, setDefaultList] = useState<FeatureCardData[]>([]);
  const [KOList, setKOList] = useState<FeatureCardData[]>([]);
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

  const hasActiveJob = freezeInputs;
  const setActiveJob = setFreezeInputs;
  // if numFeaturesKO === 0 then there should be no request
  //
  // on dev this occassionally freezes my component when
  // I go off the page for a little bit for some reason
  useEffect(() => {
    if (numFeaturesKO === 0 && hasActiveJob) {
      setActiveJob(false);
    }
  }, [numFeaturesKO]);
  if (featurizationError) {
    return (
      <UnexpectedError
        while="computing sequence features of your input sequence"
        error={featurizationError}
      />
    );
  }
  if (checkError) {
    return (
      <NormalError
        title="We're sorry! We cannot design knockouts of your inputted sequence."
        message={`Some sequence features could not be computed: ${checkError}`}
      />
    );
  }
  if (featureTargets === null || featureVector === null) {
    return (
      <div className="flex flex-col gap-2">
        <Header />
        <Loading>Computing input sequence's features</Loading>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <Header />
      <IdromePicker
        disabled={freezeInputs}
        forKO={true}
        idromeState={idromeState}
      ></IdromePicker>
      <FeatureKOPicker
        featureTargets={featureTargets}
        featureVector={featureVector}
        KOFeatureTargets={KOFeatureTargets}
        setReqTimestamp={setReqTimestamp}
        KOListState={[KOList, setKOList]}
        defaultListState={[defaultList, setDefaultList]}
        disabled={freezeInputs}
      ></FeatureKOPicker>
      {hasActiveJob ? (
        <BackButton setActiveJob={setActiveJob}></BackButton>
      ) : (
        <SubmitButton
          setActiveJob={setActiveJob}
          setReqTimestamp={setReqTimestamp}
          buttonText="Click to design"
          footerText={
            numFeaturesKO > 0
              ? "Click the button above and design results will be displayed here."
              : "Design results will be displayed here once you choose some features to knockout."
          }
        ></SubmitButton>
      )}
      {hasActiveJob && (
        <GenerateKOActiveJob
          sequence={sequence}
          featureConfiguration={featureConfiguration}
          featureWeights={featureWeights}
          featureTargets={featureTargets}
          reqTimestamp={reqTimestamp}
        ></GenerateKOActiveJob>
      )}
    </div>
  );
}
