import React from "react";

const FeatureMetadataSectionContext =
  React.createContext<HTMLDetailsElement | null>(null);

export function FeatureMetadataSectionProvider(props: {
  children: React.ReactNode;
  featureMetadataEl: HTMLDetailsElement | null;
}) {
  const { children, featureMetadataEl } = props;

  return (
    <FeatureMetadataSectionContext.Provider value={featureMetadataEl}>
      {children}
    </FeatureMetadataSectionContext.Provider>
  );
}

export function useFeatureMetadataScroller() {
  const el = React.useContext(FeatureMetadataSectionContext);
  return React.useCallback(() => {
    console.log(el)
    if (!el) return;
    if (!el.open) {
      el.open = true;
    }
    el.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [el]);
}