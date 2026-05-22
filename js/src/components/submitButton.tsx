import { Button } from "@/components/ui/button";

export default function SubmitButton(props: {
  setActiveJob: (_: boolean) => void;
  setReqTimestamp: (_: number) => void;
  buttonText: string;
  footerText: string;
}) {
  const { setActiveJob, setReqTimestamp, buttonText, footerText } = props;
  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={() => {
          setActiveJob(true);
          setReqTimestamp(Date.now());
        }}
      >
        {buttonText}
      </Button>
      <div className="p-4 border rounded-md border-input text-muted-foreground">
        {footerText}
      </div>
    </div>
  );
}
