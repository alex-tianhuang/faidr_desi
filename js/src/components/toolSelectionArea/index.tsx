import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
// import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { GenerateMimicHelp, GenerateKOHelp, FeaturizeHelp } from "./helpPages";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/sheet";
import { useState } from "react";

type ToolType = "mimic" | "ko" | "feats";
const TOOL_INFO = [
  {
    propKey: "mimic",
    label: "Design feature mimic",
    helpTitle: "Designing a \"feature mimic\"",
    helpDivFactory:
      GenerateMimicHelp,
  },
  {
    propKey: "ko",
    label: "Design feature knockout",
    helpTitle: "Designing a \"feature knockout\"",
    helpDivFactory:
      GenerateKOHelp,
  },
  {
    propKey: "feats",
    label: "Compute features",
    helpTitle: "Computing features",
    helpDivFactory:
      FeaturizeHelp
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
    <div className={cn("border-t py-5 flex flex-row gap-4", disabled ? "border-input" : "border-primary")}>
      {TOOL_INFO.map(({ propKey, label, helpTitle, helpDivFactory }) => {
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
            helpTitle={helpTitle}
            helpDiv={helpDivFactory()}
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
  helpTitle: string;
  helpDiv: React.ReactNode;
}) {
  const { tool, setTool, disabled, label, isActive, helpTitle, helpDiv } = props;
  const [openHelp, setOpenHelp] = useState(false);
  return (
    <div className="flex-1 flex flex-row gap-1">
      <Button
        className="flex-1"
        onClick={() => setTool(isActive ? null : tool)}
        disabled={disabled}
      >
        {isActive ? "Go back to editing sequence" : label}
      </Button>
      <Button
        onClick={() => setOpenHelp(true)}
        disabled={disabled}
      >
        ?
      </Button>
      <Sheet open={openHelp} onOpenChange={setOpenHelp}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{helpTitle}</SheetTitle>
            <SheetDescription>{helpDiv}</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  );
}
