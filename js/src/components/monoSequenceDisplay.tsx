import { copyToClipboard } from "@/lib/utils";
import { Copy, CopyCheck } from "lucide-react";
import { useState } from "react";

const COPY_COOLDOWN_MS = 2000;

export default function MonoSequenceDisplay(props: {
  sequence: string;
}) {
  const { sequence } = props;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyToClipboard(sequence);
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_COOLDOWN_MS);
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted p-4">
      <code className="text-sm break-all flex-1 leading-relaxed">
        {sequence}
      </code>
      <button
        onClick={handleCopy}
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150"
        title="Copy sequence"
      >
        <span
          className={`transition-opacity duration-200 absolute ${copied ? "opacity-100" : "opacity-0"}`}
        >
          <CopyCheck className="h-4 w-4 text-green-500" />
        </span>
        <span
          className={`transition-opacity duration-200 ${copied ? "opacity-0" : "opacity-100"}`}
        >
          <Copy className="h-4 w-4" />
        </span>
      </button>
    </div>
  );
}
