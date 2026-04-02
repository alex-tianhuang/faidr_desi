import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
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
          {resolvedTheme === "dark" ? <Sun /> : <Moon />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Change to {otherTheme} mode</TooltipContent>
    </Tooltip>
  );
}
