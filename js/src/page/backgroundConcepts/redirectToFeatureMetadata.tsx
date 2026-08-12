import { useFeatureMetadataScroller } from "@/contexts/featureMetadataSectionContext";
import { NUM_FEATURES } from "@/lib/consts";

export default function RedirectToFeatureMetadata() {
  const scrollToFeatureMetadata = useFeatureMetadataScroller();
  return (
    <details>
      <summary className="text-sm hover:text-foreground">
        What are <span className="italic">these</span> {NUM_FEATURES} sequence
        features, specifically?
      </summary>
      <div className="px-2.5 pt-2">
        <a onClick={scrollToFeatureMetadata} className="hover:underline">
          Click here to browse additional information about our features at the
          bottom of this page.
        </a>
      </div>
    </details>
  );
}
