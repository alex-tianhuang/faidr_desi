import Link from "@/components/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const TOOLTIP_CONTENTS = {
  ["Motif Count"]: (
    <span>
      Features from the "Motif Count" category are computed by counting the
      number of occurrences of sequence motifs from the{" "}
      <Link
        inline
        className="font-bold text-md text-background"
        href="https://doi.org/10.1093/nar/gkt1047"
      >
        ELM
      </Link>{" "}
      (or other{" "}
      <Link
        inline
        className="font-bold text-md text-background"
        href="https://en.wikipedia.org/wiki/Regular_expression"
      >
        regular expressions
      </Link>{" "}
      , a.k.a. regexes).
    </span>
  ),
  ["Motif Span"]: (
    <span>
      Features from the "Motif Span" category are computed by counting the
      residues <span className="italic">spanned</span> by (i.e., the number of
      residues that are a part of) occurrences of motifs from the{" "}
      <Link
        inline
        className="font-bold text-md text-background"
        href="https://doi.org/10.1093/nar/gkt1047"
      >
        ELM
      </Link>{" "}
      (or other{" "}
      <Link
        inline
        className="font-bold text-md text-background"
        href="https://en.wikipedia.org/wiki/Regular_expression"
      >
        regular expressions
      </Link>{" "}
      , a.k.a. regexes).
    </span>
  ),
  Composition: (
    <span>
      Features from the "Composition" category describe the percentage of a
      sequence comprised of a particular kind of amino acid, combinations of
      them, or physical properties derived from them.
    </span>
  ),
  ["Residue Clustering"]: (
    <span>
      Features from the "Residue Clustering" category describe the degree that
      like residues cluster together in a sequence.
    </span>
  ),
  Repeats: (
    <span>
      Features from the "Repeats" category detect the presence of stretches of
      consecutive similar amino acids. These features are computed by counting
      the number of amino acids in a group that are immediately followed by
      amino acids in that same group.
    </span>
  ),
};
export default function FeatureCategoryButton(props: { category: string }) {
  const { category } = props;
  const content = (TOOLTIP_CONTENTS as any)[category];
  return (
    <div className="flex flex-row gap-1.5 h-fit text-xs border rounded-sm bg-background text-muted-foreground shadow-xs text-nowrap px-2 py-1">
      <div className={cn(content && "border-r pr-1.5")}>{category}</div>
      {content && (
        <Tooltip>
          <TooltipTrigger>?</TooltipTrigger>
          <TooltipContent className="text-justify">{content}</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
