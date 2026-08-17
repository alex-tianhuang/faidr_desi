import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { GenerateMimicHelp, GenerateKOHelp, FeaturizeHelp } from "./helpPages";
import { NUM_FEATURES } from "@/lib/consts";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type ToolType = "mimic" | "ko" | "feats";
const TOOL_INFO = [
  {
    propKey: "mimic",
    label: "Design a feature mimic",
    helpTitle: 'Designing a "feature mimic"',
    helpDiv: <GenerateMimicHelp />,
  },
  {
    propKey: "ko",
    label: "Design a feature knockout",
    helpTitle: 'Designing a "feature knockout"',
    helpDiv: <GenerateKOHelp />,
  },
  {
    propKey: "feats",
    label: `Compute ${NUM_FEATURES} sequence features`,
    helpTitle: "Computing features",
    helpDiv: <FeaturizeHelp />,
  },
] as const;
export default function ToolButtons(props: {
  toolState: [ToolType | null, (_: ToolType | null) => void];
  disabled: boolean;
}) {
  const {
    toolState: [activeTool, setTool],
    disabled,
  } = props;
  return (
    <div
      className={cn(
        "border rounded-md gap-2 p-2 flex flex-col",
        disabled ? "border-input" : "border-primary",
      )}
    >
      <p className="text-center text-md text-muted-foreground">
        Choose one of the tools to use below, or click the question marks to
        read more about them.
      </p>
      <div className="gap-2 flex flex-col sm:flex-row flex-wrap">
        {TOOL_INFO.map(({ propKey, label, helpTitle, helpDiv }) => {
          return (
            <ToolButton
              key={propKey}
              tool={propKey}
              setTool={setTool}
              disabled={disabled || activeTool !== null}
              label={label}
              helpTitle={helpTitle}
              helpDiv={helpDiv}
            ></ToolButton>
          );
        })}
      </div>
      {activeTool && (
        <div className="px-2.5 pb-1">
          <Button
            className="w-full"
            onClick={() => setTool(null)}
            disabled={disabled}
          >
            Try another sequence or another tool (go back)
          </Button>
        </div>
      )}
    </div>
  );
}
function ToolButton(props: {
  tool: ToolType;
  setTool: (_: ToolType | null) => void;
  disabled: boolean;
  label: string;
  helpTitle: string;
  helpDiv: React.ReactNode;
}) {
  const { tool, setTool, disabled, label, helpTitle, helpDiv } = props;
  return (
    <div className="px-2.5 flex-1 flex flex-row">
      <Button
        className="flex-1 rounded-r-none"
        onClick={() => setTool(tool)}
        disabled={disabled}
      >
        {label}
      </Button>
      <Popover>
        <PopoverTrigger
          className={cn(
            buttonVariants({ variant: "default" }),
            "rounded-l-none",
          )}
          disabled={disabled}
        >
          ?
        </PopoverTrigger>
        <PopoverContent>
          <div className="flex flex-col gap-2 bg-accent rounded-md shadow-sm pt-2 px-2">
            <div className="font-semibold underline text-center">
              {helpTitle}
            </div>
            {helpDiv}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
