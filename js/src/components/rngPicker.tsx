import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export default function RngPicker(props: {
    reqTimestampState: [number, (_: number) => void];
    disabled: boolean;
    setRngSeed: (_: number) => void;
    rngHintState: [string, (_: string) => void]
}) {
    const { disabled, setRngSeed, reqTimestampState: [timestamp, setTimestamp], rngHintState: [rngHint, setRngHint] } = props

    useEffect(() => {
        const hint = Number.parseInt(rngHint);
        const rngSeed = Number.isNaN(hint) ? timestamp : hint;
        setRngSeed(rngSeed % (2 ** 32));
    }, [rngHint, timestamp]);

    return (<div className="flex flex-row gap-3 items-center">
        <Input
            disabled={disabled}
            placeholder="Enter a number between 0 and 2 ^ 32"
            value={rngHint}
            onChange={(e) => {
                const rngHint = e.target.value;
                setRngHint(rngHint);
            }}
        />
        <span>OR</span>
        <Button disabled={disabled || rngHint.length > 0} onClick={() => {
            setRngHint(`${timestamp % (2 ** 32)}`);
            setTimestamp(Date.now())
        }}>Generate a fixed seed</Button>
    </div>);
}