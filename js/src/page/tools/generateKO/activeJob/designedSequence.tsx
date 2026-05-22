import MonoSequenceDisplay from "@/components/monoSequenceDisplay";
import { percentIdentity } from "@/lib/utils";

export default function DesignedSequence(props: {
  inputSequence: string;
  designedSequence: string;
}) {
  const { inputSequence, designedSequence } = props;
  return (
    <div className="flex flex-col border border-input rounded-md p-4 gap-2">
      <span className="text-md font-bold underline">Designed Sequence</span>
      <MonoSequenceDisplay sequence={designedSequence}></MonoSequenceDisplay>
      <span className="text-sm text-muted-foreground">
        {percentIdentity(designedSequence, inputSequence).toFixed(1)}% identity
        to user input sequence
      </span>
    </div>
  );
}
