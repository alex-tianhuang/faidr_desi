import ErrorDiv from "@/components/errorDiv";
import useFeaturizeEndpoint from "./hook";
import { FeaturesTable } from "@/components/featuresTable";

export default function FeaturizeArea(props: {
  sequence: string;
  featureConfiguration: unknown;
}) {
  const {
    initError,
    featurized,
    featurizedError
  } = useFeaturizeEndpoint(props);
  const error = initError ?? featurizedError;
  return (
    <div className="flex flex-col gap-2">
      {error && <ErrorDiv title="Failed to compute sequence features" message={error}></ErrorDiv>}
      {featurized && <FeaturesTable data={featurized}></FeaturesTable>}
    </div>
  );
}