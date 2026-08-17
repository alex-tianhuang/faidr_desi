import { NUM_FEATURES } from "@/lib/consts";

export default function Header() {
  return (
    <>
      <div className="flex flex-col border rounded-md p-4 gap-2">
        <p className="text-xl font-bold text-center">
          Designing a "feature knockout"
        </p>
        <p className="text-justify text-muted-foreground">
          Use this program to design a sequence that preserves most of the{" "}
          {NUM_FEATURES} sequence features of your input sequence, but sets
          specific sequence features that you want to ablate to the IDRome
          minimum.
        </p>
      </div>
    </>
  );
}
