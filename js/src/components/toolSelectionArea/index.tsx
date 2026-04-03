import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { GenerateMimicHelp, GenerateKOHelp, FeaturizeHelp } from "./helpPages";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import { useState } from "react";
import { NUM_FEATURES } from "@/lib/consts";

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
    label: `Get ${NUM_FEATURES} sequence features`,
    helpTitle: "Computing features",
    helpDiv: <FeaturizeHelp />,
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
    <div
      className={cn(
        "border rounded-md gap-2 p-2 flex flex-col",
        disabled ? "border-input" : "border-primary",
      )}
    >
      <p className="text-center text-md text-muted-foreground">
        Choose one of the tools to use below, or click the question marks to read
        more about them.
      </p>
      <div className="gap-2 flex flex-col sm:flex-row flex-wrap">
        {TOOL_INFO.map(({ propKey, label, helpTitle, helpDiv }) => {
          const isActive = activeTool === propKey;
          const isInactive = activeTool !== null && !isActive;
          return (
            <ToolButton
              key={propKey}
              tool={propKey}
              setTool={setTool}
              disabled={disabled || isInactive}
              label={label}
              isActive={propKey === activeTool}
              helpTitle={helpTitle}
              helpDiv={helpDiv}
            ></ToolButton>
          );
        })}
      </div>
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
  const { tool, setTool, disabled, label, isActive, helpTitle, helpDiv } =
    props;
  const [openHelp, setOpenHelp] = useState(false);
  return (
    <div className="flex-1 flex flex-row">
      <Button
        className="flex-1 rounded-r-none"
        onClick={() => setTool(isActive ? null : tool)}
        disabled={disabled}
      >
        {isActive ? (
          <span className="text-xs">Try other sequence / try other tool</span>
        ) : (
          label
        )}
      </Button>
      <Button
        className="rounded-l-none"
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
