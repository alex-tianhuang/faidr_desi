import ErrorDiv from "@/components/errorDiv";
import useFeaturizeEndpoint from "./hook";
import { FeaturesTable } from "@/components/featuresTable";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "@/components/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { LoaderPinwheelIcon } from "@hugeicons/core-free-icons";

const MY_EMAIL = "tianh.huang@mail.utoronto.ca";
export default function FeaturizeArea(props: {
  sequence: string;
  featureConfiguration: unknown;
}) {
  const { initError, featurized, featurizedError } =
    useFeaturizeEndpoint(props);
  const error = initError ?? featurizedError;
  return (
    <div className="flex flex-col gap-2">
      <FeaturizeHeader/>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>{"We're sorry! An internal error occurred."}</AlertTitle>
          <AlertDescription>
            Something we didn't account for went wrong while computing the
            sequence features of your input sequence.
            <br />
            It would help us a lot if you could copy the error below and report it to{" "}
            <Link href={`mailto:${MY_EMAIL}`} className="h-auto p-0 inline">{MY_EMAIL}</Link>.<br />
            <span className="font-bold">Error: {error}</span>
          </AlertDescription>
        </Alert>
      )}
      {featurized ? <FeaturesTable data={featurized}></FeaturesTable> : <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <HugeiconsIcon
            icon={LoaderPinwheelIcon}
            className="h-4 w-4 animate-spin"
          ></HugeiconsIcon>
          {"Computing sequence features..."}
        </div>}
    </div>
  );
}
function FeaturizeHeader() {
  return (
    <div className="flex flex-col border rounded-sm p-2 px-4 py-3">
      <p className="text-xl font-bold text-center pb-2">
        Sequence features
      </p>
      <p>
        View and download a CSV of your sequence features below.
      </p>
    </div>
  );
}