import useFeaturizeEndpoint from "@/backend/apis/featurize";
import { UnexpectedError } from "@/components/errors";
import Loading from "@/components/loading";
import type { IDRome } from "@/lib/consts";
import DesignedSequenceFeaturesTable from "./designedSequenceFeaturesTable";
import { checkAllFeatures } from "@/lib/utils";
import { useFeatureMetadataScroller } from "@/contexts/featureMetadataSectionContext";

export default function DesignedSequenceFeatures(props: {
  designedSequence: string;
  featureConfiguration: unknown;
  initialFeatureVector: Record<string, number>;
  KOFeatureTargets: Record<string, number>;
  featureTargets: Record<string, number>;
  idrome: IDRome;
}) {
  const {
    designedSequence,
    featureConfiguration,
    initialFeatureVector,
    KOFeatureTargets,
    featureTargets,
    idrome,
  } = props;
  const { featurized, featurizationError } = useFeaturizeEndpoint({
    sequence: designedSequence,
    featureConfiguration,
  });
  const { featureVector: designFeatureVector, checkError } =
    checkAllFeatures(featurized);
  const scrollToFeatureMetadata = useFeatureMetadataScroller();
  if (!designFeatureVector) {
    return (
      <div className="flex flex-col gap-2 p-4 border border-input rounded-md">
        <Loading>
          Computing sequence features of the designed sequence...
        </Loading>
      </div>
    );
  }
  const error = featurizationError || checkError;
  if (error) {
    return (
      <UnexpectedError
        while="computing features of your designed sequence"
        error={error}
      ></UnexpectedError>
    );
  }
  return (
    <div className="flex flex-col border border-input rounded-md p-4 gap-2">
      <span className="text-md font-bold underline">
        Validating Features to Knock Out
      </span>
      <p className="text-muted-foreground">
        Since features are correlated and the feature knock out algorithm is a
        simple greedy optimization algorithm, the designed sequence does not
        always knock out the intended feature or preserve others.
      </p>
      <p className="text-center text-muted-foreground">
        Look at the table below to see how well the optimizer knocked out your
        feature of interest and preserved other features.
      </p>
      <DesignedSequenceFeaturesTable
        designFeatureVector={designFeatureVector}
        initialFeatureVector={initialFeatureVector}
        KOFeatureTargets={KOFeatureTargets}
        featureTargets={featureTargets}
        idrome={idrome}
      ></DesignedSequenceFeaturesTable>
      <div className="flex flex-col gap-2 items-start">
        <div
          className="self-center px-2 h-fit rounded-sm w-fit text-sm text-muted-foreground hover:underline hover:-translate-y-px"
          onClick={scrollToFeatureMetadata}
        >
          What are these features?
        </div>
        <div className="flex flex-col gap-2 text-justify text-muted-foreground">
          <p>
            Scroll vertically in the table above to see all the sequence
            features.
          </p>
          <p>
            On small screens, you may need to horizontally in the table above to
            see the initial, target, and actual feature values of your designed
            sequence as z-scores and raw values.
          </p>
        </div>
      </div>
    </div>
  );
}
