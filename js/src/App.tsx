import { useState } from "react";
import SequenceArea from "./components/sequenceArea";
import ToolSelectionArea from "./components/toolSelectionArea";
import GenerateMimicArea from "./features/generateMimic";
import { FEATURE_CONFIGURATION, FEATURE_MEANS, FEATURE_WEIGHTS } from "./lib/consts";
import FeaturizeArea from "./features/featurize";
import GenerateKOArea from "./features/generateKO";

export default function Page() {
  const [sequence, setSequence] = useState<string | null>(null);
  const [tool, setTool] = useState<"mimic" | "ko" | "feats" | null>(null);
  const [requestStarted, setRequestStarted] = useState<boolean>(false);
  return (
    <div className="flex flex-col m-5">
      <PageHeader
        sequenceState={[sequence, setSequence]}
        toolState={[tool, setTool]}
        disabled={requestStarted}
      ></PageHeader>
      <PageFooter
        sequence={sequence}
        tool={tool}
        requestStartedState={[requestStarted, setRequestStarted]}
      ></PageFooter>
    </div>
  );
}
function PageHeader(props: {
  sequenceState: [string | null, (_: string | null) => void];
  toolState: [
    "mimic" | "ko" | "feats" | null,
    (_: "mimic" | "ko" | "feats" | null) => void,
  ];
  disabled: boolean;
}) {
  const {
    sequenceState: [sequence, setSequence],
    toolState: [activeTool, setActiveTool],
    disabled,
  } = props;
  return (
    <div className="flex flex-col">
      <SequenceArea
        disabled={disabled || (activeTool !== null)}
        sequenceState={[sequence, setSequence]}
      ></SequenceArea>
      <ToolSelectionArea
        toolState={[activeTool, setActiveTool]}
        disabled={disabled || sequence === null}
      ></ToolSelectionArea>
    </div>
  );
}
function PageFooter(props: {
  sequence: string | null;
  tool: "mimic" | "ko" | "feats" | null;
  requestStartedState: [boolean, (_: boolean) => void];
}) {
  const { sequence, tool, requestStartedState } = props;
  if (tool === null || sequence === null) return <></>;
  if (tool === "mimic") {
    return (
      <GenerateMimicArea
        sequence={sequence}
        featureConfiguration={FEATURE_CONFIGURATION}
        featureWeights={FEATURE_WEIGHTS}
        requestStartedState={requestStartedState}
      ></GenerateMimicArea>
    );
  }
  if (tool === "feats") {
    return (
      <FeaturizeArea
        sequence={sequence}
        featureConfiguration={FEATURE_CONFIGURATION}
      ></FeaturizeArea>
    );
  }
  if (tool === "ko") {
    return (
      <GenerateKOArea
        sequence={sequence}
        featureConfiguration={FEATURE_CONFIGURATION}
        featureWeights={FEATURE_WEIGHTS}
        requestStartedState={requestStartedState}
        KOFeatureTargets={FEATURE_MEANS}
      ></GenerateKOArea>
    );
  }
}
