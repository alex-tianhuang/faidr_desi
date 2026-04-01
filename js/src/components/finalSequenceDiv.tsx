import { Copy } from "@hugeicons/core-free-icons";
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
  return <div className="flex flex-col gap-1">
  <span className="text-sm font-medium">Designed Sequence</span>
  <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2">
    <code className="text-sm break-all flex-1">{sequence}</code>
    <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground shrink-0">
      {copied ? "Copied!" : <HugeiconsIcon icon={Copy} className="h-4 w-4" />}
    </button>
  </div>
</div>
}
