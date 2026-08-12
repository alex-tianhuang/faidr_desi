import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { FeatureCardData } from "@/types/generateKO";
import Preamble from "./preamble";
import FeatureKOLists from "./featureKOLists";
import { useFeatureMetadataScroller } from "@/contexts/featureMetadataSectionContext";

export default function FeatureKOPicker(props: {
  disabled: boolean;
  featureVector: Record<string, number>;
  featureTargets: Record<string, number>;
  KOFeatureTargets: Record<string, number>;
  defaultListState: [FeatureCardData[], (_: FeatureCardData[]) => void];
  KOListState: [FeatureCardData[], (_: FeatureCardData[]) => void];
  setReqTimestamp: (_: number) => void;
}) {
  const {
    disabled,
    featureVector,
    KOFeatureTargets,
    defaultListState: [defaultList, setDefaultList],
    KOListState: [KOList, setKOList],
  } = props;
  const scrollToFeatureMetadata = useFeatureMetadataScroller();
  const numFeaturesKO = KOList.length;
  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-4 border rounded-md",
        disabled ? "border-input" : "border-primary",
      )}
    >
      <Preamble />
      <FeatureKOLists
        disabled={disabled}
        defaultListState={[defaultList, setDefaultList]}
        KOListState={[KOList, setKOList]}
        featureVector={featureVector}
        KOFeatureTargets={KOFeatureTargets}
      ></FeatureKOLists>
      <span
        className="text-sm text-muted-foreground hover:underline hover:-translate-y-px"
        onClick={scrollToFeatureMetadata}
      >
        What are these feature names?
      </span>
      <Alert>
        {numFeaturesKO > 0
          ? `Setting ${numFeaturesKO} feature${numFeaturesKO > 1 ? "s" : ""} to IDRome minimum`
          : "Please choose at least one feature to knockout (set to IDRome minimum)"}
      </Alert>
      {numFeaturesKO > 0 && (
        <div className="text-muted-foreground">
          Once you have selected your features to knockout, click the button
          below to get your designed knockout sequence!
        </div>
      )}
    </div>
  );
}
