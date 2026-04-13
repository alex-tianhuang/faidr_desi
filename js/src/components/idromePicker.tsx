import type { IDRome } from "@/lib/consts";
import { Alert } from "./ui/alert";
import { cn } from "@/lib/utils";
import { Toggle } from "./ui/toggle";

export default function IdromePicker(props: {
  idromeState: [IDRome, (_: IDRome) => void];
  disabled: boolean;
  forKO: boolean;
}) {
  const {
    idromeState: [idrome, setIdrome],
    disabled,
    forKO,
  } = props;
  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-4 border rounded-md text-justify",
        disabled ? "opacity-50 border-input" : "border-primary",
      )}
    >
      <p className="flex-1 text-md font-bold underline">
        Choose IDRome background
      </p>
      <p className="text-muted-foreground">
        During design, features are scaled down by the standard deviations of a
        user-chosen IDRome. This way features that are percentages (such as
        percent glycine) that range from 0-1 and features that are counts (such
        as motifs) can be treated equally.
      </p>
      <p className="text-muted-foreground">
        Currently you can choose between {forKO && " minimums and"} weights of
        feature values in a human or a yeast IDRome. Click the buttons below to
        change which IDRome is being used.
      </p>

      <div className="flex flex-row flex-wrap gap-2 items-center text-start w-full">
        {[
          {
            key: "human" as const,
            name: "Human",
          },
          {
            key: "yeast" as const,
            name: "Yeast",
          },
        ].map((option) => (
          <Toggle
            className="flex-1 whitespace-normal self-center"
            onClick={() => setIdrome(option.key)}
            disabled={disabled}
            pressed={idrome === option.key}
          >
            <span>
              {option.name} IDRome {forKO && "minimums and"} weights
            </span>
          </Toggle>
        ))}
      </div>
      <Alert>
        <span>
          Using <span className="underline">{idrome}</span> IDRome
          {forKO && " minimums and"} weights for design.
        </span>
      </Alert>
    </div>
  );
}
