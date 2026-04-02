import useFeaturizeEndpoint from "./hook";
import { FeaturesTable } from "@/components/featuresTable";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "@/components/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { LoaderPinwheelIcon } from "@hugeicons/core-free-icons";
import { useMemo, useState } from "react";
import {
  FEATURE_CONFIGURATION,
  FEATURE_MEANS,
  FEATURE_WEIGHTS,
} from "@/lib/consts";
import type { Featurized } from "./types";
import { Button } from "@/components/ui/button";

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
            <span className="font-bold">Error: {error}</span>
          </AlertDescription>
        </Alert>
      )}
      {featurized ? (
        <>
          <div className="flex flex-row text-sm items-center">
            <span className="flex-1 text-center">
              {zscoreEnabled
                ? "Z-score features compared to the human IDRome"
                : "Raw feature values"}
            </span>
            <Button
              className="w-fit"
              onClick={() => setZscoreEnabled(!zscoreEnabled)}
            >
              {zscoreEnabled
                ? "View as raw feature values"
                : "View as z-scores against the human IDRome"}
            </Button>
          </div>
          <FeaturesTable data={featurized}></FeaturesTable>
        </>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <HugeiconsIcon
            icon={LoaderPinwheelIcon}
            className="h-4 w-4 animate-spin"
          ></HugeiconsIcon>
          {"Computing sequence features..."}
        </div>
      )}
    </div>
  );
}
function FeaturizeHeader() {
  return (
    <div className="flex flex-col border rounded-sm p-2 px-4 py-3">
      <p className="text-xl font-bold text-center pb-2">Sequence features</p>
      <p>View and download a CSV of your sequence features below.</p>
      <p>
        Scroll horizontally to see all features, or click the button to change
        whether you are looking at raw features or feature Z-scores.
      </p>
    </div>
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
