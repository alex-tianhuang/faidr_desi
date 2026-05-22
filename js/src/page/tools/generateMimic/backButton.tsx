import { Button } from "@/components/ui/button";

export default function BackButton(props: {
  setActiveJob: (_: boolean) => void;
}) {
  const { setActiveJob } = props;
  return (
    <Button
      onClick={() => {
        setActiveJob(false);
      }}
    >
      Go back to editing sequence or other parameters
    </Button>
  );
}
