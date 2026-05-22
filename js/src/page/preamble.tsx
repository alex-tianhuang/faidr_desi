import Link from "@/components/link";
import { NUM_FEATURES } from "@/lib/consts";

export default function Preamble() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-justify">
        Welcome to FAIDR-Desi, a simple webapp that uses a greedy sequence
        feature matching algorithm to design intrinsically disordered protein
        regions (IDRs). This tool is based on{" "}
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
      <p className="text-muted-foreground text-justify">
        This app uses {NUM_FEATURES} sequence features consisting of short
        linear interaction motifs (SLIMs), aminoacid composition, and residue
        patterning statistics. The association between these sequence features
        and IDR function has been described in these papers:{" "}
        <Link
          href="https://pmc.ncbi.nlm.nih.gov/articles/PMC7932695/"
          inline={true}
          className="text-md"
        >
          Zarin et al., 2021. (eLife)
        </Link>{" "}
        and{" "}
        <Link
          href="https://www.biorxiv.org/content/10.1101/2024.03.15.585291v1"
          inline={true}
          className="text-md"
        >
          Pritisanac et al., 2024. (BioRxiv)
        </Link>
        .
      </p>
    </div>
  );
}