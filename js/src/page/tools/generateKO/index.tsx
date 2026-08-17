import { useMemo, useState } from "react";
import useFeaturizeEndpoint from "@/backend/apis/featurize";
import { type IDRome } from "@/lib/consts";
import { checkAllFeatures, compareStrings } from "@/lib/utils";
import { NormalError, UnexpectedError } from "@/components/errors";
import Loading from "@/components/loading";
import IdromePicker from "@/components/idromePicker";
import Header from "./header";
import GenerateKOActiveJob from "./activeJob";
import type { FeatureCardData } from "@/types/generateKO";
import FeatureKOPicker from "./featureKOPicker";
import { Button } from "@/components/ui/button";

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
    idromeState: [idrome, setIDRome],
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
        idromeState={[idrome, setIDRome]}
      ></IdromePicker>
      <FeatureKOPicker
        featureVector={featureVector}
        KOFeatureTargets={KOFeatureTargets}
        KOListState={[KOList, setKOList]}
        defaultListState={[defaultList, setDefaultList]}
        disabled={freezeInputs}
      ></FeatureKOPicker>
      <div className="flex flex-col gap-2 p-4 border rounded-md border-primary">
        <p className="font-bold underline">Submit your design job</p>
        <p className="text-muted-foreground">
          Once you have selected your IDRome, input sequence, and features to
          knockout, click the button below to get your designed knockout
          sequence.
        </p>
        <Button
          onClick={() => {
            setActiveJob(true);
            setReqTimestamp(Date.now());
          }}
          disabled={numFeaturesKO === 0 || freezeInputs}
        >
          Click to design
        </Button>
      </div>
      {hasActiveJob ? (
        <div className="flex flex-col gap-2 p-4 border rounded-md border-primary">
          <Button onClick={() => setActiveJob(false)}>
            Change your design job (go back)
          </Button>
          <GenerateKOActiveJob
            sequence={sequence}
            featureConfiguration={featureConfiguration}
            initialFeatureVector={featureVector}
            KOFeatureTargets={KOFeatureTargets}
            featureWeights={featureWeights}
            featureTargets={featureTargets}
            reqTimestamp={reqTimestamp}
            idrome={idrome}
          ></GenerateKOActiveJob>
        </div>
      ) : (
        <div className="p-4 border rounded-md border-input text-muted-foreground">
          {numFeaturesKO > 0
            ? "Click the button above and design results will be displayed here."
            : "Design results will be displayed here once you choose some features to knockout."}
        </div>
      )}
    </div>
  );
}
