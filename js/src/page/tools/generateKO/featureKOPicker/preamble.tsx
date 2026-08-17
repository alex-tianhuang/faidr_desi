import { ChevronsRight } from "lucide-react";

export default function Preamble() {
  return (
    <>
      <p className="text-left text-foreground text-md font-bold underline">
        Pick features to knockout
      </p>
      <div className="flex flex-col text-justify text-muted-foreground gap-2">
        <p>
          On the left is the list of features to be preserved in your sequence,
          and on the right is the list of features to set to the IDRome minimum.
        </p>
        <p>
          Pick features to knockout by clicking on the cards in the left list,
          then click the {<ChevronsRight className="inline" />} button to move
          those to the right list.
        </p>
        <p>
          In the list on the right, each of the cards should display the
          original feature value and the intended target value in the format
          "(original value) → (IDRome minimum value)".
        </p>
      </div>
    </>
  );
}
