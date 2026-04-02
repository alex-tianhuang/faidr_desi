import { Copy, Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

const COPY_COOLDOWN_MS = 2000;

export default function FinalSequenceDiv(props: { sequence: string }) {
  const { sequence } = props;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sequence);
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_COOLDOWN_MS);
  };

  return (
    <div className="flex flex-col gap-2 px-4">
      <span className="text-md font-semibold tracking-wide underline">
        Designed Sequence
      </span>
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted px-4 py-3">
        <code className="text-sm break-all flex-1 leading-relaxed">{sequence}</code>
        <button
          onClick={handleCopy}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150"
          title="Copy sequence"
        >
          <span
            className={`transition-opacity duration-200 absolute ${copied ? "opacity-100" : "opacity-0"}`}
          >
            <HugeiconsIcon icon={Tick01Icon} className="h-4 w-4 text-green-500" />
          </span>
          <span
            className={`transition-opacity duration-200 ${copied ? "opacity-0" : "opacity-100"}`}
          >
            <HugeiconsIcon icon={Copy} className="h-4 w-4" />
          </span>
        </button>
      </div>
    </div>
  );
}