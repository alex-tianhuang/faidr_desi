import useFeaturizeEndpoint from "@/backend/apis/featurize";
import { FeaturesTable } from "@/page/tools/featurize/featuresTable";
import { Alert } from "@/components/ui/alert";
import { useMemo, useState } from "react";
import { type IDRome } from "@/lib/consts";
import type { Featurized } from "@/types/featurize";
import Loading from "@/components/loading";
import { Toggle } from "@/components/ui/toggle";
import { UnexpectedError } from "@/components/errors";
import featuresToIDRomeZscores from "@/lib/utils";

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
  return (
    <div className="flex flex-col gap-2">
      {featurizationError ? (
        <UnexpectedError
          while="computing sequence features of your input sequence"
          error={featurizationError}
        ></UnexpectedError>
      ) : (
        <FeaturizeResultsArea
          featurized={featurized}
          postProcessingState={[
            postProcessing,
            (option) => {
              setPostProcessing(option);
              if (option === "yeast" || option === "human") {
                setIdrome(option);
              }
            },
          ]}
        ></FeaturizeResultsArea>
      )}
    </div>
  );
}
function FeaturizeResultsArea(props: {
  featurized: Record<string, Featurized> | null;
  postProcessingState: [IDRome | "none", (_: IDRome | "none") => void];
}) {
  const {
    postProcessingState: [postProcessing, setPostProcessing],
    featurized,
  } = props;
  const postProcessingDescription =
    postProcessing !== "none"
      ? `${postProcessing} IDRome Z-scores`
      : "raw features";
  const optionDescription = (option: typeof postProcessing) =>
    option !== "none"
      ? `Z-score features (${option} IDRome)`
      : "Raw feature values";
  return (
    <>
      <div className="flex flex-col gap-2 p-4 border rounded-md border-primary">
        <p className="text-xl font-bold text-center">
          Computing sequence features
        </p>
        <p className="text-center text-muted-foreground">
          View and download a CSV of your sequence features below.
        </p>
        {featurized ? (
          <>
            <FeaturesTable
              data={featurized}
              downloadButtonText={`Download as CSV (${postProcessingDescription})`}
            ></FeaturesTable>
            <p className="text-center text-muted-foreground">
              Scroll horizontally in the table above to see more sequence
              features!
            </p>
          </>
        ) : (
          <Loading>Computing sequence features...</Loading>
        )}
      </div>
      {featurized && (
        <div className="flex flex-col gap-2 p-4 border rounded-md border-primary">
          <p className="text-md font-bold underline">
            Switch between raw features and Z-scores
          </p>
          <p className="text-justify text-muted-foreground">
            Click one of the buttons below to change how features are reported
            in the table above.
          </p>
          <div className="flex flex-row flex-wrap items-center gap-2">
            {(["human", "yeast", "none"] as const).map((option) => {
              const pressed = option === postProcessing;
              return (
                <Toggle
                  className="flex-1 min-w-fit"
                  key={option}
                  pressed={pressed}
                  onPressedChange={(pressed) => {
                    if (pressed) {
                      setPostProcessing(option);
                    }
                  }}
                >
                  {optionDescription(option)}
                </Toggle>
              );
            })}
            <Alert>
              <span>
                Viewing sequence features as{" "}
                <span className="underline">{postProcessingDescription}</span>
              </span>
            </Alert>
          </div>
        </div>
      )}
    </>
  );
}
