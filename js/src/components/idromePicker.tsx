import type { IDRome } from "@/lib/consts";
import { Alert } from "./ui/alert";
import { cn } from "@/lib/utils";
import { Switch } from "./ui/switch";

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
        feature values in a human or a yeast IDRome. Use the switch below to
        change which IDRome is being used.
      </p>

      <Alert className="flex flex-row">
        <div className="flex flex-row pr-3 border-r gap-2">
          Human
          <Switch
            checked={idrome === "yeast"}
            className="data-checked:bg-muted-foreground data-unchecked:bg-muted-foreground"
            onCheckedChange={(checked) =>
              setIdrome(checked ? "yeast" : "human")
            }
          ></Switch>
          Yeast
        </div>
        <div className="pl-3">
          Using <span className="underline">{idrome}</span> IDRome
          {forKO && " minimums and"} weights for design.
        </div>
      </Alert>
    </div>
  );
}
