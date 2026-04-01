import { NUM_FEATURES } from "@/lib/consts";
import Link from "../link";

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
      <Link href="https://www.biorxiv.org/content/10.1101/2023.04.28.538739v1">
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
        the IDRome average, while keeping the other sequence features unchanged.
        This has been explored in this preprint:
      </p>
      <Link href="https://www.biorxiv.org/content/10.1101/2023.04.28.538739v1">
        BioRxiv (2023)
      </Link>
    </div>
  );
}

export function FeaturizeHelp() {
  return (
    <div className="flex flex-col">
      <p className="text-sm max-w-xs leading-relaxed">
        This tool computes {NUM_FEATURES} sequence features described in papers
        from the labs of Julie Forman-Kay and Alan Moses:
      </p>
      <Link href="https://pmc.ncbi.nlm.nih.gov/articles/PMC7932695/">
        eLife (2021)
      </Link>
      <Link href="https://www.biorxiv.org/content/10.1101/2024.03.15.585291v1">
        BioRxiv (2024)
      </Link>
    </div>
  );
}
