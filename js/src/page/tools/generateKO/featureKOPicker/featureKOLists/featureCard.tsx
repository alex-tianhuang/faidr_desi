import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function FeatureCard(props: {
  disabled: boolean;
  toggleSelect: () => void;
  selected: boolean;
  featureID: string;
  variant: "default" | "ko"
  featureVector: Record<string, number>;
  KOFeatureTargets: Record<string, number>;
  showHintOnHover: boolean;
}) {
  const {
    disabled,
    toggleSelect,
    selected,
    featureID,
    variant,
    featureVector,
    KOFeatureTargets,
    showHintOnHover,
  } = props;
  return (
    <Tooltip>
      <TooltipTrigger disabled={!showHintOnHover} className="w-full">
        <Button
          disabled={disabled}
          onClick={toggleSelect}
          className="items-center gap-3 w-full text-sm rounded-sm"
          variant={selected ? "default" : "outline"}
        >
          <span className="flex-1 truncate font-medium self-left text-left">
            {featureID}
          </span>
          <span className="shrink-0 text-xs opacity-70 text-right self-right">
            {Number(featureVector[featureID]).toPrecision(3)}
            {variant === "ko" && (
              <>
                {" → "}
                {Number(KOFeatureTargets[featureID]).toPrecision(3)}
              </>
            )}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Click me to select me for knockout!</TooltipContent>
    </Tooltip>
  );
}
