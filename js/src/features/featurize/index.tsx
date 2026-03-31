import { useMemo, useState } from "react";
import useGenerateMimicEndpoint from "./hook";
import RngPicker from "@/components/rngPicker";
import { Button } from "@/components/ui/button";
import { DesignIterationsTable } from "@/components/designIterationsTable";
import useGenerateKOEndpoint from "./hook";
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