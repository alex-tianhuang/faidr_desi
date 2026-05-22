import { NUM_FEATURES } from "@/lib/consts";

export default function Header() {
  return (
    <div className="flex flex-col border rounded-md p-4 gap-2">
      <p className="text-xl font-bold text-center">
        Designing a "feature mimic"
      </p>
      <p className="text-justify text-muted-foreground">
        {`Use this program to design a sequence that matches ${NUM_FEATURES} sequence features of your inputted sequence. `}
        In other words, it "mimics" the features of your input sequence.
      </p>
    </div>
  );
}
