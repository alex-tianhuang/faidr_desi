import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { parseRngHint } from "./utils";

export default function RngPicker(props: {
  disabled: boolean;
  rngHintState: [string, (_: string) => void];
  rngSeed: number;
}) {
  const {
    disabled,
    rngHintState: [rngHint, setRngHint],
    rngSeed,
  } = props;
  const rngInfo = parseRngHint(rngHint, 0);
  const rngSeedDescription = rngInfo.usingTimestampForRng
    ? rngHint.length === 0
      ? "Using timestamp to seed RNG"
      : `Could not parse "${rngHint}" as a number, using timestamp to seed RNG`
    : rngInfo.overflow
      ? `User seed overflows 2 ^ 32, using ${rngSeed} to seed RNG instead (first 32 bits)`
      : rngInfo.underflow
        ? `User seed is negative, using ${rngSeed} to seed RNG instead (modulo 2 ^ 32)`
        : `Using ${rngSeed} to seed RNG`;
  return (
    <div
      className={cn(
        "flex flex-col gap-2 border rounded-md p-4",
        disabled ? "border-input opacity-50" : "border-primary",
      )}
    >
      <details>
        <summary className="text-sm cursor-pointer text-muted-foreground hover:text-foreground">
          Seed deterministically (advanced)
        </summary>
        <div className="mt-2 flex flex-col gap-2 p-4 border rounded-md border-input">
          <span className="flex-1 text-start text-md font-bold underline">
            RNG Seed
          </span>
          <span className="text-muted-foreground">
            In order to generate the random initial sequence for design, we use
            a seedable RNG. You can input your own seed for the RNG or click the
            button on the right to generate an example seed. If you do nothing,
            the current time will be used to generate a seed for you.
          </span>
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
          <Alert>{rngSeedDescription}</Alert>
        </div>
      </details>
    </div>
  );
}
