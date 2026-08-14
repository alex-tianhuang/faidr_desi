import Link from "@/components/link";
import { NUM_FEATURES } from "@/lib/consts";

export default function Preamble() {
  return (
    <div className="flex flex-col gap-2 text-muted-foreground text-justify">
      <p>
        Welcome to FAIDR-Desi, a simple webapp that uses a greedy sequence
        feature matching algorithm to design intrinsically disordered protein{" "}
        regions (IDRs).
      </p>
      <p>
        This tool is based on{" "}
        <Link
          href="https://www.biorxiv.org/content/10.1101/2023.04.28.538739v1"
          inline={true}
          className="text-md"
        >
          this 2023 preprint
        </Link>{" "}
        by the Julie Forman-Kay and Alan Moses group, who have been using
        sequence feature-based design as a framework for hypothesis testing IDR
        function.
      </p>
      <p>
        This app uses {NUM_FEATURES} sequence features consisting of short
        linear interaction motifs (SLIMs), amino acid composition, and residue
        patterning statistics. The association between these sequence features
        and IDR function has been described in these papers:{" "}
        <Link
          href="https://pmc.ncbi.nlm.nih.gov/articles/PMC7932695/"
          inline={true}
          className="text-md"
        >
          Zarin <span className="italic">et al.</span>, 2021. (eLife)
        </Link>{" "}
        and{" "}
        <Link
          inline={true}
          className="text-md"
          href="https://doi.org/10.1073/pnas.2604562123"
        >
          Pritišanac <span className="italic">et al.</span>, 2026. (PNAS)
        </Link>
        .
      </p>
    </div>
  );
}
