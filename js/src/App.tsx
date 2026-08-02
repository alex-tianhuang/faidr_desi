import { useState } from "react";
import ToolButtons from "./page/toolButtons";
import { type IDRome } from "./lib/consts";
import Banner from "./page/banner";
import Preamble from "./page/preamble";
import Footer from "./page/footer";
import SequenceInput from "./page/sequenceInput";
import Tool from "./page/tools";
import BackgroundReadings from "./page/backgroundReadings";

export default function App() {
  const [sequence, setSequence] = useState<string | null>(null);
  const [tool, setTool] = useState<"mimic" | "ko" | "feats" | null>(null);
  const [idrome, setIdrome] = useState<IDRome>("human");
  const [freezeInputs, setFreezeInputs] = useState<boolean>(false);
  return (
    <div className="flex flex-col h-screen w-screen">
      <Banner />
      <div className="flex flex-col px-5 pt-2 pb-5 gap-2 min-w-80">
        <section id="preamble">
          <Preamble />
        </section>
        <section id="background_concepts">
          <BackgroundReadings />
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
      </div>
      <Footer />
    </div>
  );
}
