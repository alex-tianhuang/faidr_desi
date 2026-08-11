import React from "react";
import ToolButtons from "./page/toolButtons";
import { type IDRome } from "./lib/consts";
import Banner from "./page/banner";
import Preamble from "./page/preamble";
import Footer from "./page/footer";
import SequenceInput from "./page/sequenceInput";
import Tool from "./page/tools";
import BackgroundConcepts from "./page/backgroundConcepts";
import FeatureMetadataSection from "./page/featureMetadata";
import { FeatureMetadataSectionProvider } from "./contexts/featureMetadataSectionContext";

export default function App() {
  const [sequence, setSequence] = React.useState<string | null>(null);
  const [tool, setTool] = React.useState<"mimic" | "ko" | "feats" | null>(null);
  const [idrome, setIdrome] = React.useState<IDRome>("human");
  const [freezeInputs, setFreezeInputs] = React.useState<boolean>(false);
  const [featureMetadataEl, setFeatureMetadataEl] = React.useState<HTMLDetailsElement | null>(null);
  return (
    <div className="flex flex-col h-screen w-screen">
      <Banner />
      <FeatureMetadataSectionProvider
        featureMetadataEl={featureMetadataEl}
      >
        <div className="flex flex-col px-5 pt-2 pb-5 gap-2 min-w-80">
          <section id="preamble">
            <Preamble />
          </section>
          <section id="background_concepts">
            <BackgroundConcepts />
          </section>
          <section id="tool">
            <div className="flex flex-col gap-2 w-full">
              <SequenceInput
                disabled={freezeInputs || tool !== null}
                sequenceState={[sequence, setSequence]}
              ></SequenceInput>
              <ToolButtons
                toolState={[tool, setTool]}
                disabled={freezeInputs || sequence === null}
              ></ToolButtons>
              <Tool
                sequence={sequence}
                tool={tool}
                freezeInputsState={[freezeInputs, setFreezeInputs]}
                idromeState={[idrome, setIdrome]}
              ></Tool>
            </div>
          </section>
          <section id="feature_metadata">
            <FeatureMetadataSection setFeatureMetadataEl={setFeatureMetadataEl} />
          </section>
        </div>
      </FeatureMetadataSectionProvider>
      <Footer />
    </div>
  );
}
