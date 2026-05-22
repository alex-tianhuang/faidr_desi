import GenerateMimic from "@/page/tools/generateMimic";
import {
  FEATURE_CONFIGURATION,
  FEATURE_MINIMUMS,
  FEATURE_WEIGHTS,
  type IDRome,
} from "@/lib/consts";
import FeaturizeArea from "@/page/tools/featurize";
import GenerateKOArea from "@/page/tools/generateKO";
export default function Tool(props: {
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
      <GenerateMimic
        sequence={sequence}
        featureConfiguration={FEATURE_CONFIGURATION}
        featureWeights={FEATURE_WEIGHTS[idrome]}
        freezeInputsState={freezeInputsState}
        idromeState={[idrome, setIdrome]}
      ></GenerateMimic>
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