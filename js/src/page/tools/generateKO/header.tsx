import { NUM_FEATURES } from "@/lib/consts";

export default function Header() {
  return (
    <>
      <div className="flex flex-col border rounded-md p-4 gap-2">
        <p className="text-xl font-bold text-center">
          Designing a "feature knockout"
        </p>
        <p className="text-justify text-muted-foreground">
          {`Use this program to design a sequence that preserves ${NUM_FEATURES} sequence features of your inputted sequence, `}
          but set some sequence features that you want to ablate to the IDRome
          minimum. In other words, it "knocks out" those features.
        </p>
      </div>
    </>
  );
}
