import { Alert } from "@/components/ui/alert";
import { Toggle } from "@/components/ui/toggle";
import type { IDRome } from "@/lib/consts";

export default function ZScoreButtons(props: {
  postProcessingState: [IDRome | "none", (_: IDRome | "none") => void];
}) {
  const {
    postProcessingState: [postProcessing, setPostProcessing],
  } = props;
  const postProcessingDescription =
    postProcessing !== "none"
      ? `${postProcessing} IDRome Z-scores`
      : "raw features";

  const optionDescription = (option: typeof postProcessing) =>
    option !== "none"
      ? `Z-score features (${option} IDRome)`
      : "Raw feature values";
  return (
    <div className="flex flex-col gap-2 p-4 border rounded-md border-primary">
      <p className="text-md font-bold underline">
        Switch between raw features and Z-scores
      </p>
      <p className="text-justify text-muted-foreground">
        Click one of the buttons below to change how features are reported in
        the table above.
      </p>
      <div className="flex flex-row flex-wrap items-center gap-2">
        {(["human", "yeast", "none"] as const).map((option) => {
          const pressed = option === postProcessing;
          return (
            <Toggle
              className="flex-1 min-w-fit"
              key={option}
              pressed={pressed}
              onPressedChange={(pressed) => {
                if (pressed) {
                  setPostProcessing(option);
                }
              }}
            >
              {optionDescription(option)}
            </Toggle>
          );
        })}
        <Alert>
          <span>
            Viewing sequence features as{" "}
            <span className="underline">{postProcessingDescription}</span>
          </span>
        </Alert>
      </div>
    </div>
  );
}
