import { Button } from "@/components/ui/button";

export default function SubmitButton(props: {
  setActiveJob: (_: boolean) => void;
  setReqTimestamp: (_: number) => void;
}) {
  const {
    setActiveJob,
    setReqTimestamp,
  } = props;
  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={() => {
          setActiveJob(true);
          setReqTimestamp(Date.now());
        }}
      >
        Click to design
      </Button>
      <div className="p-4 border rounded-md border-input text-muted-foreground">
        Click the button above and design results will be displayed here.
      </div>
    </div>
  );
}
