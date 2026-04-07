import { useEffect, useState } from "react";
import SequenceArea from "./components/sequenceArea";
import ToolSelectionArea from "./components/toolSelectionArea";
import GenerateMimicArea from "./features/generateMimic";
import {
  FEATURE_CONFIGURATION,
  FEATURE_MEANS,
  FEATURE_WEIGHTS,
  NUM_FEATURES,
  type IDRome,
} from "./lib/consts";
import FeaturizeArea from "./features/featurize";
import GenerateKOArea from "./features/generateKO";
import Link from "./components/link";
import { ThemeToggle } from "./components/themeToggle";

export default function Page() {
  const [sequence, setSequence] = useState<string | null>(null);
  const [tool, setTool] = useState<"mimic" | "ko" | "feats" | null>(null);
  const [requestStarted, setRequestStarted] = useState<boolean>(false);
  const [idrome, setIdrome] = useState<IDRome>("human");
  // guard because sometimes `requestStarted` gets stuck
  useEffect(() => {
    if (sequence === null || tool === null) {
      setRequestStarted(false);
    }
  }, [sequence, tool]);
  return (
    <div className="flex flex-col item-center m-5 gap-2 min-w-80">
      <PageHeader
        sequenceState={[sequence, setSequence]}
        toolState={[tool, setTool]}
        disabled={requestStarted}
      ></PageHeader>
      <PageFooter
        sequence={sequence}
        tool={tool}
        requestStartedState={[requestStarted, setRequestStarted]}
        idromeState={[idrome, setIdrome]}
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
    <div className="flex flex-col gap-2">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle></ThemeToggle>
      </div>
      <Preamble />
      <SequenceArea
        disabled={disabled || activeTool !== null}
        sequenceState={[sequence, setSequence]}
      ></SequenceArea>
      <ToolSelectionArea
        toolState={[activeTool, setActiveTool]}
        disabled={disabled || sequence === null}
      ></ToolSelectionArea>
    </div>
  );
}
function Preamble() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-2xl font-bold text-center underline">
        Simple IDR Design
      </p>
      <p className="text-muted-foreground text-justify">
        Welcome to a simple webapp that uses a greedy sequence feature matching
        algorithm to design intrinsically disordered protein regions (IDRs).
        This tool is based on{" "}
        <Link
          href="https://www.biorxiv.org/content/10.1101/2023.04.28.538739v1"
          inline
        >
          this 2023 preprint
        </Link>{" "}
        by the Julie Forman-Kay and Alan Moses group, who have been using
        sequence feature-based design as a framework for hypothesis testing IDR
        function.
      </p>
      <p className="text-muted-foreground text-justify">
        This app uses {NUM_FEATURES} sequence features consisting of short
        linear interaction motifs (SLIMs), aminoacid composition, and residue
        patterning statistics. The association between these sequence features
        and IDR function has been described in these papers:{" "}
        <Link
          href="https://pmc.ncbi.nlm.nih.gov/articles/PMC7932695/"
          inline={true}
        >
          Zarin et al., 2021. (eLife)
        </Link>{" "}
        and{" "}
        <Link
          href="https://www.biorxiv.org/content/10.1101/2024.03.15.585291v1"
          inline={true}
        >
          Pritisanac et al., 2024. (BioRxiv)
        </Link>
        .
      </p>
    </div>
  );
}
function PageFooter(props: {
  sequence: string | null;
  tool: "mimic" | "ko" | "feats" | null;
  requestStartedState: [boolean, (_: boolean) => void];
  idromeState: [IDRome, (_: IDRome) => void];
}) {
  const {
    sequence,
    tool,
    requestStartedState,
    idromeState: [idrome, setIdrome],
  } = props;
  if (tool === null || sequence === null) return <></>;
  if (tool === "mimic") {
    return (
      <GenerateMimicArea
        sequence={sequence}
        featureConfiguration={FEATURE_CONFIGURATION}
        featureWeights={FEATURE_WEIGHTS[idrome]}
        requestStartedState={requestStartedState}
        idromeState={[idrome, setIdrome]}
      ></GenerateMimicArea>
    );
  }
  if (tool === "feats") {
    return (
      <FeaturizeArea
        sequence={sequence}
        featureConfiguration={FEATURE_CONFIGURATION}
        idromeState={[idrome, setIdrome]}
      ></FeaturizeArea>
    );
  }
  if (tool === "ko") {
    return (
      <GenerateKOArea
        sequence={sequence}
        featureConfiguration={FEATURE_CONFIGURATION}
        featureWeights={FEATURE_WEIGHTS[idrome]}
        requestStartedState={requestStartedState}
        KOFeatureTargets={FEATURE_MEANS[idrome]}
        idromeState={[idrome, setIdrome]}
      ></GenerateKOArea>
    );
  }
}
