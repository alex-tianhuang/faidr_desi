import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { FeatureCard } from "@/types/generateKO";
import Preamble from "./preamble";
import FeatureKOLists from "./featureKOLists";

export default function FeatureKOPicker(props: {
  disabled: boolean;
  featureVector: Record<string, number>;
  featureTargets: Record<string, number>;
  KOFeatureTargets: Record<string, number>;
  defaultListState: [FeatureCard[], (_: FeatureCard[]) => void];
  KOListState: [FeatureCard[], (_: FeatureCard[]) => void];
  setReqTimestamp: (_: number) => void;
}) {
  const {
    disabled,
    featureVector,
    KOFeatureTargets,
    defaultListState: [defaultList, setDefaultList],
    KOListState: [KOList, setKOList],
  } = props;
  const numFeaturesKO = KOList.length;
  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-4 border rounded-md",
        disabled ? "border-input" : "border-primary",
      )}
    >
      <Preamble/>
      <FeatureKOLists
        disabled={disabled}
        defaultListState={[defaultList, setDefaultList]}
        KOListState={[KOList, setKOList]}
        featureVector={featureVector}
        KOFeatureTargets={KOFeatureTargets}
      ></FeatureKOLists>
      <Alert>
        {numFeaturesKO > 0
          ? `Setting ${numFeaturesKO} feature${numFeaturesKO > 1 ? "s" : ""} to IDRome minimum`
          : "Please choose at least one feature to knockout (set to IDRome minimum)"}
      </Alert>
      {numFeaturesKO > 0 && (
        <div className="text-muted-foreground">
          Once you have done selected your features to knockout, click the
          button below to get your designed knockout sequence!
        </div>
      )}
    </div>
  );
}