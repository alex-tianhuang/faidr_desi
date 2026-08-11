import { NUM_FEATURES } from "@/lib/consts";
import React from "react";

export default function RedirectToFeatureMetadata(props: {
  featureMetadataRef: React.RefObject<HTMLDetailsElement | null>;
}) {
  const { featureMetadataRef } = props;
  const detailsRef = React.useRef<HTMLDetailsElement>(null);
  const scrollToFeatureMetadata = React.useCallback(() => {
    const el = featureMetadataRef.current;
    if (!el) return;
    if (!el.open) {
      el.open = true;
    }
    el.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [featureMetadataRef.current]);
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
