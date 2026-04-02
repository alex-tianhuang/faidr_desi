import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Moon, Sun } from "@hugeicons/core-free-icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

/** Theme switch written by Claude Code. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const otherTheme = resolvedTheme === "dark" ? "light" : "dark";
  return (
    <Tooltip>
      <TooltipTrigger>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(otherTheme)}
        >
          {resolvedTheme === "dark" ? (
            <HugeiconsIcon icon={Sun} />
          ) : (
            <HugeiconsIcon icon={Moon} />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Change to {otherTheme} mode</TooltipContent>
    </Tooltip>
  );
}
