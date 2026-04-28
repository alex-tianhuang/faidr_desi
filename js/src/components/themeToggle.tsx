import { useTheme } from "next-themes";
import { Button, buttonVariants } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

/** Theme switch written by Claude Code. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const otherTheme = resolvedTheme === "dark" ? "light" : "dark";
  return (
    <Tooltip>
      <TooltipTrigger>
        <div
          className={buttonVariants({ variant: "ghost", size: "icon" })}
          onClick={() => setTheme(otherTheme)}
        >
          {resolvedTheme === "dark" ? <Sun /> : <Moon />}
        </div>
      </TooltipTrigger>
      <TooltipContent>Change to {otherTheme} mode</TooltipContent>
    </Tooltip>
  );
}
