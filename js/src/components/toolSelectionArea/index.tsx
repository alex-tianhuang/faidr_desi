import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

type ToolType = "mimic" | "ko" | "feats";
const TOOL_INFO = [
  {
    propKey: "mimic",
    label: "Design Feature Mimic",
    helpDiv:
      "Lorem ipsum make some feature mimics and stuff\nlots of funky stuff\nwow so cool",
  },
  {
    propKey: "ko",
    label: "Design Feature Knockout",
    helpDiv:
      "Lorem ipsum make some feature KOs and stuff\nlots of funky stuff\nwow so cool",
  },
  {
    propKey: "feats",
    label: "Compute features",
    helpDiv:
      "Lorem ipsum make some feature vectors\nlots of funky stuff\nwow so cool",
  },
] as const;
export default function ToolSelectionArea(props: {
  toolState: [ToolType | null, (_: ToolType | null) => void];
  disabled: boolean;
}) {
  const {
    toolState: [activeTool, setTool],
    disabled,
  } = props;
  return (
    <div className={cn("border-t py-2 flex flex-row mx-5 gap-4", disabled ? "border-input" : "border-primary")}>
      {TOOL_INFO.map(({ propKey, label, helpDiv }) => {
        const isActive = activeTool === propKey
        const isInactive = (activeTool !== null) && (!isActive);
        return (
          <ToolButton
            key={propKey}
            tool={propKey}
            setTool={setTool}
            disabled={disabled || isInactive}
            label={label}
            isActive={propKey === activeTool}
            helpDiv={helpDiv}
          ></ToolButton>
        );
      })}
    </div>
  );
}
function ToolButton(props: {
  tool: ToolType;
  setTool: (_: ToolType | null) => void;
  disabled: boolean;
  label: string;
  isActive: boolean;
  helpDiv: React.ReactNode;
}) {
  const { tool, setTool, disabled, label, isActive, helpDiv } = props;
  return (
    <div className="flex-1 flex flex-row gap-1">
      <Button
        className="flex-1"
        onClick={() => setTool(isActive ? null : tool)}
        disabled={disabled}
      >
        {label}
      </Button>
      <Popover>
        <PopoverTrigger disabled={disabled}>
          <Button disabled={disabled}>?</Button>
        </PopoverTrigger>
        <PopoverContent>
          {helpDiv}
        </PopoverContent>
      </Popover>
    </div>
  );
}
