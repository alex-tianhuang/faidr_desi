import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ReactNode } from "react";

export default function MoveCardsButton(props: {
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
  tooltipText: string;
  className: string;
  override?: boolean;
}) {
  const { onClick, disabled, children, tooltipText, override, className } =
    props;
  return (
    <Tooltip
      key={typeof override === "boolean" ? override.toString() : undefined}
      open={override}
    >
      <TooltipTrigger disabled={disabled}>
        <Button
          disabled={disabled}
          className={className}
          onClick={onClick}
          size="icon"
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltipText}</TooltipContent>
    </Tooltip>
  );
}
