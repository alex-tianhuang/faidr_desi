import useFeaturizeEndpoint from "@/backend/apis/featurize";
import { FeaturesTable } from "@/page/tools/featurize/featuresTable";
import { useMemo, useState } from "react";
import { type IDRome } from "@/lib/consts";
import Loading from "@/components/loading";
import { UnexpectedError } from "@/components/errors";
import featuresToIDRomeZscores from "@/lib/utils";
import ZScoreButtons from "./zscoreButtons";

export default function FeaturizeArea(props: {
  sequence: string;
  featureConfiguration: unknown;
  idromeState: [IDRome, (_: IDRome) => void];
}) {
  const {
    idromeState: [idrome, setIdrome],
  } = props;
  const { featurizationError, featurized: featurizedRaw } =
    useFeaturizeEndpoint(props);
  const [postProcessing, setPostProcessing] = useState<IDRome | "none">(idrome);
  const featurized = useMemo(
    () =>
      postProcessing !== "none"
        ? featurizedRaw
          ? featuresToIDRomeZscores(featurizedRaw, postProcessing)
          : null
        : featurizedRaw,
    [featurizedRaw, postProcessing],
  );
  if (featurizationError) {
    return (
      <UnexpectedError
        while="computing sequence features of your input sequence"
        error={featurizationError}
      />
    );
  }
  if (!featurized) {
    return (
      <div className="flex flex-col gap-2 p-4 border rounded-md border-primary">
        <Loading>Computing sequence features...</Loading>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <FeaturesTable
        postProcessing={postProcessing}
        featurized={featurized}
      ></FeaturesTable>
      <ZScoreButtons
        postProcessingState={[
          postProcessing,
          (option) => {
            setPostProcessing(option);
            if (option === "yeast" || option === "human") {
              setIdrome(option);
            }
          },
        ]}
      ></ZScoreButtons>
    </div>
  );
}
