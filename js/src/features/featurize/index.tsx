import useFeaturizeEndpoint from "./hook";
import { FeaturesTable } from "@/components/featuresTable";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "@/components/link";
import { useMemo, useState } from "react";
import {
  FEATURE_CONFIGURATION,
  FEATURE_MEANS,
  FEATURE_WEIGHTS,
  type IDRome,
} from "@/lib/consts";
import type { Featurized } from "./types";
import { Button } from "@/components/ui/button";
import Loading from "@/components/loading";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MY_EMAIL = "tianh.huang@mail.utoronto.ca";
export default function FeaturizeArea(props: {
  sequence: string;
  featureConfiguration: unknown;
  idromeState: [IDRome, (_: IDRome) => void];
}) {
  const {
    idromeState: [idrome, setIdrome],
  } = props;
  const {
    initError,
    featurized: featurizedRaw,
    featurizedError,
  } = useFeaturizeEndpoint(props);
  const [postProcessing, setPostProcessing] = useState<IDRome | "none">(idrome);
  const postProcessingDescription =
    postProcessing !== "none"
      ? `${postProcessing} IDRome Z-scores`
      : "raw features";
  const featurized = useMemo(
    () =>
      postProcessing !== "none"
        ? featurizedRaw
          ? featuresToIDRomeZscores(featurizedRaw, postProcessing)
          : null
        : featurizedRaw,
    [featurizedRaw, postProcessing],
  );
  const error = initError ?? featurizedError;
  const viewAsMessage = (option: typeof postProcessing) =>
    option !== "none"
      ? `Z-score features (${option} IDRome)`
      : "Raw feature values";
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
              <span>{viewAsMessage(postProcessing)}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="outline">View as other</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuRadioGroup
                  value={postProcessing}
                  onValueChange={(value) => {
                    if (!value) return;
                    setPostProcessing(value!);
                    if (value !== "human" && value !== "yeast") return;
                    setIdrome(value);
                  }}
                >
                  {(["yeast", "human", "none"] as const).map((key) => (
                    <DropdownMenuRadioItem key={key} value={key}>
                      {viewAsMessage(key)}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <FeaturesTable
            data={featurized}
            downloadButtonText={`Download as CSV (${postProcessingDescription})`}
          ></FeaturesTable>
          <p className="text-sm text-justify text-muted-foreground">
            Scroll horizontally in the table above to see more sequence
            features!
          </p>
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
      <div className="flex flex-col border rounded-md p-4">
        <p className="text-xl font-bold text-center">
          Computing sequence features
        </p>
        <p className="text-center text-muted-foreground">
          View and download a CSV of your sequence features below.
        </p>
      </div>
      <div className="flex flex-col border rounded-md p-4">
        <p className="text-md font-bold underline">Instructions</p>
        <p className="text-justify text-muted-foreground">
          Click the small button on the right to change whether you are looking
          at raw features or feature Z-scores.
        </p>
      </div>
    </>
  );
}
function featuresToIDRomeZscores(
  featurized: Record<keyof typeof FEATURE_CONFIGURATION, Featurized>,
  idrome: IDRome,
) {
  return Object.fromEntries(
    Object.entries(featurized).map(([featureID, value]) => [
      featureID,
      value.case === "ok"
        ? {
            case: "ok",
            value:
              (value.value - (FEATURE_MEANS[idrome] as any)[featureID]) *
              (FEATURE_WEIGHTS[idrome] as any)[featureID],
          }
        : value,
    ]),
  ) as Record<keyof typeof FEATURE_CONFIGURATION, Featurized>;
}
