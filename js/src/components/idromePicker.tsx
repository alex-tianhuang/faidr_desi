import type { IDRome } from "@/lib/consts";
import { Button } from "./ui/button";
import { Alert } from "./ui/alert";
import { cn } from "@/lib/utils";

export default function IdromePicker(props: {
  idromeState: [IDRome, (_: IDRome) => void];
  disabled: boolean;
  includeMeans: boolean;
}) {
  const {
    idromeState: [idrome, setIdrome],
    disabled,
    includeMeans,
  } = props;

  const otherIdrome = idrome === "yeast" ? "human" : "yeast";
  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-4 border rounded-md",
        disabled ? "opacity-50 border-input" : "border-primary",
      )}
    >
      <span className="flex-1 text-start text-md font-bold underline">
        Choose IDRome background
      </span>
      <p className="text-muted-foreground">
        During design, features are treated as Z-scores against the means and
        standard deviations of a user-chosen IDRome. This way features that are
        percentages (such as percent glycine) that range from 0-1 and features
        that are counts (such as motifs) can be treated equally.
      </p>
      <p className="text-muted-foreground">
        Currently you can choose between {includeMeans && " means and"} weights
        generated from a human or a yeast IDRome. Click the button below to
        change which IDRome is being used.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 items-center text-start w-full">
        <Alert>
          <span>
            Using <span className="underline">{idrome}</span> IDRome
            {includeMeans && " means and"} weights for design.
          </span>
        </Alert>
        <Button
          className="w-fit whitespace-normal self-center"
          onClick={() => setIdrome(otherIdrome)}
          disabled={disabled}
        >
          <span>
            Click to use <span className="underline">{otherIdrome}</span> IDRome
            {includeMeans && " means and"} weights
          </span>
        </Button>
      </div>
    </div>
  );
}
