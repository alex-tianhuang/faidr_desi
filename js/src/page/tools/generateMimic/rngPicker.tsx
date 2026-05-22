import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RngPicker(props: {
  disabled: boolean;
  rngHintState: [string, (_: string) => void];
}) {
  const {
    disabled,
    rngHintState: [rngHint, setRngHint],
  } = props;

  return (
    <div className="flex flex-row gap-3 items-center">
      <Input
        disabled={disabled}
        placeholder="Enter a number between 0 and 2 ^ 32"
        value={rngHint}
        onChange={(e) => {
          const rngHint = e.target.value;
          setRngHint(rngHint);
        }}
        className="bg-(--text-bg)"
      />
      <span>OR</span>
      <Button
        disabled={disabled || rngHint.length > 0}
        onClick={() => {
          const rngHint = Math.floor(Math.random() * 2 ** 32);
          setRngHint(`${rngHint % 2 ** 32}`);
        }}
      >
        Generate a fixed seed
      </Button>
    </div>
  );
}
