import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export default function RngPicker(props: {
    timestamp: number;
    disabled: boolean;
    setRngSeed: (_: number) => void;
}) {
    const { disabled, setRngSeed, timestamp } = props
    const [rngHint, setRngHint] = useState("");

    useEffect(() => {
        const hint = Number.parseInt(rngHint);
        const rngSeed = Number.isNaN(hint) ? timestamp : hint;
        setRngSeed(rngSeed % (2 ** 32));
    }, [rngHint, timestamp]);

    return (<div className="flex flex-row gap-3 items-center">
        <Input
            disabled={disabled}
            placeholder="Enter a seed for generating a random sequence (optional)"
            value={rngHint}
            onChange={(e) => {
                const rngHint = e.target.value;
                setRngHint(rngHint);
            }}
        />
        <span>OR</span>
        <Button disabled={disabled || rngHint.length > 0} onClick={() => setRngHint(`${timestamp}`)}>Generate a fixed seed</Button>
    </div>);
}