import { Loader2 } from "lucide-react";

export default function Loading(props: { children: React.ReactNode }) {
  return (
    <div className="flex flex-row items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {props.children}
    </div>
  );
}
