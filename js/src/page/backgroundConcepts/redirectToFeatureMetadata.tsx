import { useFeatureMetadataScroller } from "@/contexts/featureMetadataSectionContext";
import { NUM_FEATURES } from "@/lib/consts";
import React from "react";

export default function RedirectToFeatureMetadata() {
  const scrollToFeatureMetadata = useFeatureMetadataScroller()
  const detailsRef = React.useRef<HTMLDetailsElement>(null);
  
  React.useEffect(() => {
    const el = detailsRef.current;
    if (!el) return;
    const handleToggle = () => {
      if (el.open) {
        scrollToFeatureMetadata();
      }
    };
    el.addEventListener("toggle", handleToggle);
    return () => el.removeEventListener("toggle", handleToggle);
  }, [scrollToFeatureMetadata]);
  return (
    <details ref={detailsRef}>
      <summary>
        What are these {NUM_FEATURES} sequence features, specifically?
      </summary>
      <a onClick={scrollToFeatureMetadata}>
        See the section at the bottom of this page.
      </a>
    </details>
  );
}
