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
  } = useFeaturizeEndpoint(props)
  return (
    <div>
      {initError !== null ? <div>initError: {JSON.stringify(initError)}</div> : null}
      {featurized !== null ? <FeaturesTable data={featurized}></FeaturesTable> : null}
      {featurizedError !== null ? <div>Featurization Error: {JSON.stringify(featurizedError)}</div> : null}
    </div>
  );
}