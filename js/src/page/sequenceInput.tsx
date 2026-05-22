import { parseTextAsSequence } from "@/backend/rust/faidr_desi";
import { Button } from "@/components/ui/button";
import { useDropzone } from "react-dropzone";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useRef, useState } from "react";
import { EXAMPLE_TEXT_INPUT, MIN_SEQUENCE_LENGTH } from "@/lib/consts";
import { EditorView, Decoration } from "@codemirror/view";
import { StateField, StateEffect } from "@codemirror/state";
import CodeMirror, { oneDark } from "@uiw/react-codemirror";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTheme } from "next-themes";
import { Error } from "@/components/errors";

export default function SequenceInput(props: {
  disabled: boolean;
  sequenceState: [string | null, (_: string | null) => void];
}) {
  const {
    disabled,
    sequenceState: [sequence, setSequence],
  } = props;
  const { resolvedTheme } = useTheme();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [highlightedSpan, setHighlightedSpan] = useState<[number, number]>([
    0, 0,
  ]);
  const viewRef = useRef<EditorView | null>(null);
  const { setHighlight, extensions } = useMemo(setupTextEditor, []);

  useEffect(() => {
    if (!viewRef.current) return;
    viewRef.current.dispatch({
      effects: setHighlight.of(highlightedSpan),
    });
  }, [viewRef, highlightedSpan]);
  const setTextAndUpdateEditor = (text: string) => {
    if (!viewRef.current) return;
    viewRef.current.dispatch({
      changes: {
        from: 0,
        to: viewRef.current.state.doc.length,
        insert: text,
      },
    });
    setText(text);
  };
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
    onDrop: ([file]) => file.text().then(setTextAndUpdateEditor),
  });
  useEffect(() => {
    const r = parseTextAsSequence(text);
    if (r.case === "ok") {
      const { sequence, relevantSpan } = r;
      setHighlightedSpan(relevantSpan);
      checkLengthAndSetSequence(sequence);
    } else {
      const { error, relevantSpan } = r;
      setHighlightedSpan(relevantSpan);
      setError(error.message);
      setSequence(null);
    }
  }, [text]);
  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-2 rounded-lg border",
        disabled ? "border-input" : "border-primary",
      )}
    >
      <p
        className={cn(
          "text-center text-md text-muted-foreground",
          disabled && "opacity-50",
        )}
      >
        Paste a sequence in the box below, upload a sequence file, or use the
        example sequence.
      </p>
      <CodeMirror
        editable={!disabled}
        theme={resolvedTheme === "dark" ? oneDark : "light"}
        placeholder="Paste your protein sequence of interest here"
        onChange={setText}
        extensions={extensions}
        onCreateEditor={(view) => {
          viewRef.current = view;
        }}
        className={cn(
          "max-h-[30vh] overflow-auto",
          disabled && "opacity-50",
          error && "shadow shadow-destructive",
        )}
      />
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
          onClick={() => setTextAndUpdateEditor(EXAMPLE_TEXT_INPUT)}
        >
          Try an example
        </Button>
      </div>
      {error && (
        <Error title="Cannot parse sequence" message={error}></Error>
      )}
      {sequence !== null && (
        <Alert variant="default" className="overflow-scroll">
          <AlertTitle>
            Successfully parsed sequence (highlighted in{" "}
            {resolvedTheme === "dark" ? "orange" : "yellow"} above)
          </AlertTitle>
          <AlertDescription className="break-all">{sequence}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
/**
 * Define extensions for CodeMirror to highlight spans
 * set by `setHighlight` and also to look as much as possible
 * like plaintext.
 */
function setupTextEditor() {
  const setHighlight = StateEffect.define<[number, number]>();

  const highlightField = StateField.define({
    create: () => Decoration.none,
    update(deco, tr) {
      for (let e of tr.effects) {
        if (e.is(setHighlight)) {
          const [start, stop] = e.value;
          const docLength = tr.state.doc.length;
          if (start >= stop || stop > docLength || start < 0)
            return Decoration.none;
          return Decoration.set([
            Decoration.mark({ class: "cm-highlight" }).range(start, stop),
          ]);
        }
      }
      return deco.map(tr.changes);
    },
    provide: (f) => EditorView.decorations.from(f),
  });
  const plainTextArea = EditorView.theme({
    "&": {
      height: "100%",
      fontSize: "0.875rem", // md:text-sm
    },
    ".cm-scroller": { fontFamily: "inherit" },
    ".cm-content": { padding: "0.75rem" },
    ".cm-line": { padding: "0" },
    ".cm-activeLine": { backgroundColor: "transparent" },
    ".cm-activeLineGutter": { backgroundColor: "transparent" },
    ".cm-highlight": {
      backgroundColor: "var(--text-highlight)",
    },
  });
  return {
    setHighlight,
    extensions: [highlightField, plainTextArea, EditorView.lineWrapping],
  };
}
