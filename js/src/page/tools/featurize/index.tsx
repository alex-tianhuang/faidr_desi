import useFeaturizeEndpoint from "@/backend/apis/featurize";
import { FeaturesTable } from "@/page/tools/featurize/featuresTable";
import { useMemo } from "react";
import Loading from "@/components/loading";
import { UnexpectedError } from "@/components/errors";
import featuresToTableData from "@/lib/utils";

export default function FeaturizeArea(props: {
  sequence: string;
  featureConfiguration: unknown;
}) {
  const { featurizationError, featurized: featurizedRaw } =
    useFeaturizeEndpoint(props);
  const featurized = useMemo(
    () =>
      featurizedRaw
          ? featuresToTableData(featurizedRaw)
          : null,
    [featurizedRaw],
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
        featurized={featurized}
      ></FeaturesTable>
    </div>
  );
}
