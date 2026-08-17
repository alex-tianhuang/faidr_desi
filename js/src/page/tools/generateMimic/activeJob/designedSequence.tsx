import type useGenerateMimicEndpoint from "@/backend/apis/generateMimic";
import MonoSequenceDisplay from "@/components/monoSequenceDisplay";
import { percentIdentity } from "@/lib/utils";

export default function DesignedSequence(props: {
  inputSequence: string;
  designedSequence: string;
  progressData: ReturnType<typeof useGenerateMimicEndpoint>["progressData"];
}) {
  const { inputSequence, designedSequence, progressData } = props;
  return (
    <div className="flex flex-col border border-input rounded-md p-4 gap-2">
      <span className="text-md font-bold underline">Designed sequence</span>
      <MonoSequenceDisplay sequence={designedSequence}></MonoSequenceDisplay>
      <div className="flex flex-row items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {percentIdentity(designedSequence, inputSequence).toFixed(1)}%
          identity to user input sequence
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="text-sm text-muted-foreground">
          {percentIdentity(
            designedSequence,
            progressData.iterations[0].sequence,
          ).toFixed(1)}
          % identity to random initial sequence
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="text-sm text-muted-foreground">
          {percentIdentity(
            inputSequence,
            progressData.iterations[0].sequence,
          ).toFixed(1)}
          % identity between random initial sequence and user input sequence
        </span>
      </div>
    </div>
  );
}
