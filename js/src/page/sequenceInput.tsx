import { parseTextAsSequence } from "@/backend/rust/faidr_desi";
import { Button } from "@/components/ui/button";
import { useDropzone } from "react-dropzone";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { EXAMPLE_TEXT_INPUT, MIN_SEQUENCE_LENGTH } from "@/lib/consts";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { NormalError } from "@/components/errors";
import { Textarea } from "@/components/ui/textarea";

export default function SequenceInput(props: {
  disabled: boolean;
  sequenceState: [string | null, (_: string | null) => void];
}) {
  const {
    disabled,
    sequenceState: [sequence, setSequence],
  } = props;
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const checkLengthAndSetSequence = (sequence: string) => {
    if (sequence.length < MIN_SEQUENCE_LENGTH) {
      const lengthError =
        sequence.length > 0
          ? `Sequence is required to be at least ${MIN_SEQUENCE_LENGTH} residues long.`
          : null;
      setError(lengthError);
      setSequence(null);
    } else {
      setError(null);
      setSequence(sequence);
    }
  };
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: ([file]) => file.text().then(setText),
  });
  useEffect(() => {
    const r = parseTextAsSequence(text);
    if (r.case === "ok") {
      const { sequence } = r;
      // setHighlightedSpan(relevantSpan);
      checkLengthAndSetSequence(sequence);
    } else {
      const { error } = r;
      // setHighlightedSpan(relevantSpan);
      setError(error.message);
      setSequence(null);
    }
  }, [text]);
  return (
    <div
      className={cn(
        "flex flex-col gap-2 pt-3 px-2 rounded-lg border",
        disabled ? "border-input" : "border-primary",
        sequence !== null ? "pb-5" : "pb-2",
      )}
    >
      <p
        className={cn(
          "text-xl text-center font-bold text-foreground",
          disabled && "opacity-50",
        )}
      >
        Get started!
      </p>
      <p
        className={cn(
          "text-center text-md text-muted-foreground",
          disabled && "opacity-50",
        )}
      >
        Paste a sequence in the box below, upload a sequence file, or use the
        example sequence.
      </p>
      <div className="px-2.5">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your protein sequence of interest here"
          className={cn(
            "max-h-[30vh] overflow-auto",
            disabled && "opacity-50",
            error && "shadow shadow-destructive",
          )}
        />
      </div>
      <span className="text-center">OR</span>
      <div className="flex flex-col sm:flex-row self-center">
        <Button
          className="rounded-t-xl rounded-b-none sm:rounded-none sm:rounded-l-full"
          disabled={disabled}
          {...getRootProps()}
        >
          Upload a FASTA file (uses the first sequence)
          <Input {...getInputProps()} />
        </Button>
        <Button
          disabled={disabled}
          className="rounded-b-xl rounded-t-none sm:rounded-none sm:rounded-r-full"
          onClick={() => setText(EXAMPLE_TEXT_INPUT)}
        >
          Try an example
        </Button>
      </div>
      <div className="px-2.5">
        {error && (
          <NormalError
            title="Uh oh! We can't parse your input as a sequence"
            message={error}
          ></NormalError>
        )}
        {sequence !== null && (
          <Alert variant="default" className="overflow-scroll">
            <AlertTitle>Successfully parsed sequence</AlertTitle>
            <AlertDescription className="break-all">
              {sequence}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
