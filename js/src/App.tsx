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
  const [featureMetadataEl, setFeatureMetadataEl] =
    React.useState<HTMLDetailsElement | null>(null);
  return (
    <div className="flex flex-col h-screen w-screen">
      <Banner />
      <FeatureMetadataSectionProvider featureMetadataEl={featureMetadataEl}>
        <section id="welcome">
          <div className="flex flex-col px-5 pt-2 pb-3 gap-2 min-w-80 border-b border-foreground shadow-sm">
            <div className="-mx-5 -mt-2 px-2 border-r border-b rounded-br-md w-fit font-semibold bg-card font-serif border-foreground">
              Welcome
            </div>
            <Preamble />
            <BackgroundConcepts />
          </div>
        </section>
        <section id="tools">
          <div className="flex flex-col px-5 py-3 gap-2 min-w-80 border-b border-foreground shadow-sm">
            <div className="-mx-5 -mt-3 px-2 border-r border-b rounded-br-md w-fit font-semibold bg-card font-serif border-foreground">
              Tools
            </div>
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
          </div>
        </section>
        <section id="about_these_features">
          <div className="flex flex-col px-5 pt-3 pb-5 min-w-80 gap-2">
            <div className="-mx-5 -mt-3 px-2 border-r border-b rounded-br-md w-fit font-semibold bg-card font-serif border-foreground">
              About These Features
            </div>
            <FeatureMetadataSection
              setFeatureMetadataEl={setFeatureMetadataEl}
            />
          </div>
        </section>
      </FeatureMetadataSectionProvider>
      <Footer />
    </div>
  );
}
