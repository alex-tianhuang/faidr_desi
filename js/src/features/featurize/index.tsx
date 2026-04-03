import useFeaturizeEndpoint from "./hook";
import { FeaturesTable } from "@/components/featuresTable";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "@/components/link";
import { useMemo, useState } from "react";
import {
  FEATURE_CONFIGURATION,
  FEATURE_MEANS,
  FEATURE_WEIGHTS,
} from "@/lib/consts";
import type { Featurized } from "./types";
import { Button } from "@/components/ui/button";
import Loading from "@/components/loading";

const MY_EMAIL = "tianh.huang@mail.utoronto.ca";
export default function FeaturizeArea(props: {
  sequence: string;
  featureConfiguration: unknown;
}) {
  const {
    initError,
    featurized: featurizedRaw,
    featurizedError,
  } = useFeaturizeEndpoint(props);
  const [zscoreEnabled, setZscoreEnabled] = useState(true);
  const featurized = useMemo(
    () =>
      zscoreEnabled
        ? featurizedRaw
          ? featuresToIDRomeZscores(featurizedRaw)
          : null
        : featurizedRaw,
    [featurizedRaw, zscoreEnabled],
  );
  const error = initError ?? featurizedError;
  return (
    <div className="flex flex-col gap-2">
      <FeaturizeHeader />
      {error && (
        <Alert variant="destructive">
          <AlertTitle>{"We're sorry! An internal error occurred."}</AlertTitle>
          <AlertDescription>
            Something we didn't account for went wrong while computing the
            sequence features of your input sequence.
            <br />
            It would help us a lot if you could copy the error below and report
            it to{" "}
            <Link href={`mailto:${MY_EMAIL}`} inline={true}>
              {MY_EMAIL}
            </Link>
            .<br />
            <span className="underline">Error: {error}</span>
          </AlertDescription>
        </Alert>
      )}
      {featurized ? (
        <div className="flex flex-col gap-2 p-4 border rounded-md border-primary">
          <div className="flex flex-row text-muted-foreground items-center">
            <div className="flex-1 flex flex-col text-sm text-start">
              <span>Viewing as:</span>
              <span>
                {zscoreEnabled
                  ? "Z-score features compared to the human IDRome"
                  : "Raw feature values"}
              </span>
            </div>
            <Button
              className="w-fit text-xs"
              variant="outline"
              onClick={() => setZscoreEnabled(!zscoreEnabled)}
            >
              {zscoreEnabled
                ? "View as raw feature values"
                : "View as z-scores against the human IDRome"}
            </Button>
          </div>
          <FeaturesTable data={featurized}></FeaturesTable>
        </div>
      ) : (
        <Loading>Computing sequence features...</Loading>
      )}
    </div>
  );
}
function FeaturizeHeader() {
  return (
    <>
      <div className="flex flex-col border rounded-md px-4 py-3">
        <p className="text-xl font-bold text-center">Computing sequence features</p>
        <p className="text-center text-muted-foreground">View and download a CSV of your sequence features below.</p>
      </div>
      <div className="flex flex-col border rounded-md px-4 py-3">
        <p className="text-md font-bold underline">Instructions</p>
        <p className="text-justify text-muted-foreground">
          Click the small button on the right to change whether you are looking
          at raw features or feature Z-scores.
        </p>
        <p className="text-justify text-muted-foreground">Scroll horizontally to see your sequence features!</p>
      </div>
    </>
  );
}
function featuresToIDRomeZscores(
  featurized: Record<keyof typeof FEATURE_CONFIGURATION, Featurized>,
) {
  return Object.fromEntries(
    Object.entries(featurized).map(([featureID, value]) => [
      featureID,
      value.case === "ok"
        ? {
            case: "ok",
            value:
              (value.value - (FEATURE_MEANS as any)[featureID]) *
              (FEATURE_WEIGHTS as any)[featureID],
          }
        : value,
    ]),
  ) as Record<keyof typeof FEATURE_CONFIGURATION, Featurized>;
}
