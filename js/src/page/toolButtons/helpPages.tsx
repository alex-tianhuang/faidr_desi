import { NUM_FEATURES } from "@/lib/consts";
import Link from "@/components/link";

export function GenerateMimicHelp() {
  return (
    <div className="flex flex-col">
      <p className="text-sm max-w-xs leading-relaxed">
        A "feature mimic" is a sequence which has very similar sequence features
        as a target (input) sequence. It is designed by starting from a random
        sequence and using point mutations to iteratively minimize the distance
        in normalized feature space to the target (input) sequence. This has
        been explored in this preprint:
      </p>
      <Link
        href="https://www.biorxiv.org/content/10.1101/2023.04.28.538739v1"
        inline={false}
      >
        BioRxiv (2023)
      </Link>
    </div>
  );
}

export function GenerateKOHelp() {
  return (
    <div className="flex flex-col">
      <p className="text-sm max-w-xs leading-relaxed">
        A "feature knockout" starts from a reference (input) sequence and uses
        point mutations to try and drive a user-defined subset of features to
        the IDRome minimum, while keeping the other sequence features unchanged.
        This has been explored in this preprint:
      </p>
      <Link
        href="https://www.biorxiv.org/content/10.1101/2023.04.28.538739v1"
        inline={false}
      >
        BioRxiv (2023)
      </Link>
    </div>
  );
}

export function FeaturizeHelp() {
  return (
    <div className="flex flex-col">
      <p className="text-sm max-w-xs leading-relaxed">
        This tool computes {NUM_FEATURES} sequence features, like motifs,
        residue composition, and residue patterning statistics (see papers at
        the bottom). This tool also shows the features as a Z-score compared to
        the mean and variance of raw sequence features in a reference (human or
        yeast) IDRome.
      </p>
      <Link
        href="https://pmc.ncbi.nlm.nih.gov/articles/PMC7932695/"
        inline={false}
      >
        eLife (2021)
      </Link>
      <Link href="https://doi.org/10.1073/pnas.2604562123" inline={false}>
        PNAS (2026)
      </Link>
    </div>
  );
}
