import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export default function SubmitButton(props: {
  setActiveJob: (_: boolean) => void;
  setReqTimestamp: (_: number) => void;
  children: ReactNode
}) {
  const {
    setActiveJob,
    setReqTimestamp,
    children
  } = props;
  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={() => {
          setActiveJob(true);
          setReqTimestamp(Date.now());
        }}
      >
        {children}
      </Button>
      <div className="p-4 border rounded-md border-input text-muted-foreground">
        Click the button above and design results will be displayed here.
      </div>
    </div>
  );
}
