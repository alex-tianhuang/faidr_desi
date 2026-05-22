import { useEffect, useState } from "react";
import ToolButtons from "./page/toolButtons";
import GenerateMimicArea from "./features/generateMimic";
import {
  FEATURE_CONFIGURATION,
  FEATURE_MINIMUMS,
  FEATURE_WEIGHTS,
  type IDRome,
} from "./lib/consts";
import FeaturizeArea from "./features/featurize";
import GenerateKOArea from "./features/generateKO";
import Banner from "./page/banner";
import Preamble from "./page/preamble";
import Footer from "./page/footer";
import SequenceInput from "./page/sequenceInput";

export default function App() {
  const [sequence, setSequence] = useState<string | null>(null);
  const [tool, setTool] = useState<"mimic" | "ko" | "feats" | null>(null);
  const [idrome, setIdrome] = useState<IDRome>("human");
  const [freezeInputs, setFreezeInputs] = useState<boolean>(false);
  // guard because sometimes `requestStarted` gets stuck
  useEffect(() => {
    if (sequence === null || tool === null) {
      setFreezeInputs(false);
    }
  }, [sequence, tool]);
  return (
    <div className="flex flex-col h-screen w-screen">
      <Banner />
      <div className="flex flex-col item-center px-5 pt-2 pb-5 gap-2 min-w-80">
        <Preamble />
        <SequenceInput
          disabled={freezeInputs || tool !== null}
          sequenceState={[sequence, setSequence]}
        ></SequenceInput>
        <ToolButtons
          toolState={[tool, setTool]}
          disabled={freezeInputs || sequence === null}
        ></ToolButtons>
        <ToolArea
          sequence={sequence}
          tool={tool}
          freezeInputsState={[freezeInputs, setFreezeInputs]}
          idromeState={[idrome, setIdrome]}
        ></ToolArea>
      </div>
      <Footer />
    </div>
  );
}
/** Displays the chosen tool if there is a sequence and tool. */
function ToolArea(props: {
  sequence: string | null;
  tool: "mimic" | "ko" | "feats" | null;
  freezeInputsState: [boolean, (_: boolean) => void];
  idromeState: [IDRome, (_: IDRome) => void];
}) {
  const {
    sequence,
    tool,
    freezeInputsState,
    idromeState: [idrome, setIdrome],
  } = props;
  if (tool === null || sequence === null) return null;
  if (tool === "mimic") {
    return (
      <GenerateMimicArea
        sequence={sequence}
        featureConfiguration={FEATURE_CONFIGURATION}
        featureWeights={FEATURE_WEIGHTS[idrome]}
        requestStartedState={freezeInputsState}
        idromeState={[idrome, setIdrome]}
      ></GenerateMimicArea>
    );
  }
  if (tool === "ko") {
    return (
      <GenerateKOArea
        sequence={sequence}
        featureConfiguration={FEATURE_CONFIGURATION}
        featureWeights={FEATURE_WEIGHTS[idrome]}
        requestStartedState={freezeInputsState}
        KOFeatureTargets={FEATURE_MINIMUMS[idrome]}
        idromeState={[idrome, setIdrome]}
      ></GenerateKOArea>
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
}