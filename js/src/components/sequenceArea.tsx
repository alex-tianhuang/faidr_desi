import {
  parseFirstSequenceOfFasta,
  parseTextAsSequence,
} from "@/backend/rust/idrdesign_app";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useDropzone } from "react-dropzone";
import { Input } from "./ui/input";
import { useState } from "react";
import { MIN_SEQUENCE_LENGTH } from "@/lib/consts";

export default function SequenceArea(props: {
  disabled: boolean;
  setSequence: (_: string | null) => void;
}) {
  const {
    disabled,
    setSequence
  } = props;
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const checkLengthAndSetSequence = (sequence: string) => {
    if (sequence.length < MIN_SEQUENCE_LENGTH) {
        setError(`Sequence is required to be at least ${MIN_SEQUENCE_LENGTH} residues long.`);
        setSequence(null);
    } else {
        setError(null);
        setSequence(sequence);
    }
  }
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: ([file]) => file.text().then((text) => {
        setText(text);
        let sequence;
        try {
            sequence = parseFirstSequenceOfFasta(text);
        } catch (e) {
            setError(`${e}`);
            setSequence(null);
            return
        }
        checkLengthAndSetSequence(sequence)
    }),
  });
  return (
    <>
      <Textarea
        disabled={disabled}
        placeholder="Paste your protein sequence of interest here."
        value={text}
        onChange={(e) => {
            const text = e.target.value;
            setText(text);
            let sequence;
            try {
                sequence = parseTextAsSequence(text);
            } catch (e) {
                setError(`${e}`);
                setSequence(null);
                return
            }
            checkLengthAndSetSequence(sequence)
        }}
      />
      <Button
        disabled={disabled}
        value="Upload a FASTA file and the first sequence will be used."
        {...getRootProps()}
      >
        <Input {...getInputProps()}></Input>
      </Button>
      {error !== null ? <div>{error}</div> : <></>}
    </>
  );
}
