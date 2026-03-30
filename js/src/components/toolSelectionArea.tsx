import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

type ToolType = "mimic" | "ko" | "feats";
const TOOL_INFO = [
  ["mimic", "Design Feature Mimic"] as const,
  ["ko", "Design Feature Knockout"] as const,
  ["feats", "Compute features"] as const,
]
export default function ToolSelectionArea(props: {
  toolState: [
    ToolType | null,
    (_: ToolType | null) => void,
  ];
  disabled: boolean;
}) {
  const {
    toolState: [activeTool, setTool],
    disabled,
  } = props;
  return (
    <>
      {TOOL_INFO.map(([tool, label]) => {
        return (
          <ToolButton
            tool={tool}
            setTool={setTool}
            disabled={disabled}
            label={label}
            isActive={tool === activeTool}
          ></ToolButton>
        );
      })}
    </>
  );
}
function ToolButton(props: {
  tool: ToolType;
  setTool: (_: ToolType | null) => void;
  disabled: boolean;
  label: string;
  isActive: boolean;
}) {
  const { tool, setTool, disabled, label, isActive } = props;
  return (
    <>
      <Popover key={`popover-${tool}`}>
        <PopoverTrigger>
          <Button>?</Button>
        </PopoverTrigger>
        <PopoverContent>
          <p>Tooltip placeholder</p>
        </PopoverContent>
      </Popover>
      <Button
        key={`button-${tool}`}
        onClick={() => setTool(isActive ? null : tool)}
        disabled={disabled}
      >
        {label}
      </Button>
    </>
  );
}
