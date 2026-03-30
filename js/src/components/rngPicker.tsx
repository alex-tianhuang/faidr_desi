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

    return (<>
        <Input
            disabled={disabled}
            placeholder="default RNG seed is a unix timestamp"
            value={rngHint}
            onChange={(e) => {
                const rngHint = e.target.value;
                setRngHint(rngHint);
            }}
        />
        <Button value="Use default seed" disabled={disabled || rngHint.length > 0} onClick={() => setRngHint(`${timestamp}`)}></Button>
    </>);
}