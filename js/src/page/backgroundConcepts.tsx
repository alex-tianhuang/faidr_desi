import Link from "@/components/link";
import { useFeatureMetadataScroller } from "@/contexts/featureMetadataSectionContext";
import { NUM_FEATURES } from "@/lib/consts";

export default function BackgroundConcepts() {
  const scrollToFeatureMetadata = useFeatureMetadataScroller();
  return (
    <div className="border rounded-md border-muted px-3 pb-3 pt-2 gap-2 flex flex-col text-muted-foreground">
      <p className="flex-1 text-md font-bold text-foreground underline">
        Background Concepts
      </p>
      <div className="border rounded-md border-muted p-2 gap-2 flex flex-col bg-card">
        <details>
          <summary className="text-sm hover:text-foreground">
            What are IDRs?
          </summary>
          <div className="mt-2 px-2.5">
            <span className="underline">I</span>ntrinsically{" "}
            <span className="underline">D</span>isordered protein{" "}
            <span className="underline">R</span>egions (IDRs) are regions of
            proteins without stable tertiary structure. (Intrinsically
            disordered proteins, IDPs, are full-length proteins without stable
            tertiary structure, and are often included in the broad definition
            of IDRs.). IDRs are involved in subcellular localization targeting
            (to membrane-bound and non-membrane-associated organelles), and in
            regulating critical biological processes such as transcription,
            translation, and signaling [
            <Link
              inline
              href="https://doi.org/10.1038/s41580-023-00673-0"
              className="text-md text-muted-foreground"
            >
              Holehouse and Kragelund, 2023. (Nature)
            </Link>
            ]. Genetic variants in IDRs have been implicated in numerous
            diseases, including neurodevelopmental and neurodegenerative
            diseases and cancers [
            <Link
              inline
              className="text-md text-muted-foreground"
              href="https://doi.org/10.1016/j.cell.2020.11.050"
            >
              Tsang <span className="italic">et al.</span>, 2020. (Cell)
            </Link>
            ].
          </div>
        </details>
      </div>
      <div className="border rounded-md border-muted p-2 gap-2 flex flex-col bg-card">
        <details>
          <summary className="text-sm hover:text-foreground">
            What are sequence features?
          </summary>
          <div className="gap-2 flex flex-col py-2 px-2.5">
            <span>
              Sequence features are simple properties that can be calculated for
              a sequence. Whereas the conserved elements of folded peptides are
              commonly extractable via multiple sequence alignments (using
              algorithms such as{" "}
              <Link
                inline
                className="text-md text-muted-foreground"
                href="https://doi.org/10.1016/s0022-2836(05)80360-2"
              >
                BLAST
              </Link>{" "}
              and{" "}
              <Link
                inline
                className="text-md text-muted-foreground"
                href="https://doi.org/10.1093/nar/gkr367"
              >
                HMMER
              </Link>
              ), IDRs tend to be less subject to evolutionary constraints at the
              primary sequence level. Instead, it has been shown that IDRs
              conserve certain sequence features that are aggregate properties
              over the whole IDR [
              <Link
                inline
                className="text-md text-muted-foreground"
                href="https://doi.org/10.1371/journal.pone.0288388"
              >
                Riley <span className="italic">et al.</span>, 2023. (PLOS)
              </Link>
              ].{" "}
              <span
                className="font-semibold hover:underline"
                onClick={scrollToFeatureMetadata}
              >
                Click here to see what features are used in this app with some
                additional information about them
              </span>
              . Some categories of sequence features that have been studied are
              described below:
            </span>
            <details className="rounded-md p-2 gap-2 bg-accent shadow-sm">
              <summary className="text-sm hover:text-foreground">
                What is sequence composition?
              </summary>
              <div className="px-2.5 pt-2">
                Composition describes the percentage of a sequence comprised of
                a particular kind of amino acid, or combinations of them. Among
                other functions, the composition profile of an IDR is known to
                be strongly determinant of its ability to form phase-separated
                condensates and encode chemical specificity of those condensates
                [
                <Link
                  inline
                  className="text-md text-muted-foreground"
                  href="https://doi.org/10.1073/pnas.1304749110"
                >
                  Das and Pappu, 2013. (PNAS)
                </Link>
                ]. A couple illustrative examples are:
                <ul className="pl-5 py-2 gap-2 flex flex-col">
                  <li>
                    <div className="flex flex-row gap-2">
                      <div className="h-fit rounded-md shadow-sm px-2 border text-muted-foreground">
                        AA_F
                      </div>{" "}
                      <p>
                        is defined as the percentage of a sequence comprised of
                        phenylalanine.
                      </p>
                    </div>
                    <p>
                      Phenylalanine is a large aromatic amino acid amenable to
                      pi-pi and pi-cation interactions, including those involved
                      in phase separation [
                      <Link
                        inline
                        className="text-md text-muted-foreground"
                        href="https://www.nature.com/articles/s12276-022-00857-2"
                      >
                        Lee <span className="italic">et al.</span>, 2013.
                        (Nature)
                      </Link>
                      ]. For example, FG-Nucleoporins, which have IDRs that form
                      a condensed phase at the nuclear pore, are enriched in
                      phenylalanine and glycine. It has been shown that
                      FG-repeats underlie this condensed phase which acts as the
                      permeability barrier of the pore. This enables the nuclear
                      pore to partition nuclear transport receptors via
                      hydrophobic and pi interactions, facilitating the
                      transport of cargo [
                      <Link
                        inline
                        className="text-md text-muted-foreground"
                        href="https://doi.org/10.1016/j.cell.2007.06.024"
                      >
                        Frey and Görlich, 2007. (Cell)
                      </Link>
                      ;{" "}
                      <Link
                        inline
                        className="text-md text-muted-foreground"
                        href="https://doi.org/10.1016/s0092-8674(00)00014-3"
                      >
                        Bayliss <span className="italic">et al.</span>, 2000.
                        (Cell)
                      </Link>
                      ].
                    </p>
                  </li>
                  <li>
                    <div className="flex flex-row gap-2">
                      <div className="h-fit rounded-md shadow-sm px-2 border text-muted-foreground">
                        NCPR
                      </div>
                      <p>
                        or <span className="underline">N</span>et{" "}
                        <span className="underline">C</span>harge{" "}
                        <span className="underline">P</span>er{" "}
                        <span className="underline">R</span>esidue, is defined
                        as the percentage of basic residues (lysine/arginine)
                        minus acidic residues (glutamine/asparagine) in the
                        sequence.
                      </p>
                    </div>
                    <p>
                      Charged residues, which drive electrostatic interactions,
                      are important for many biological systems. For example,
                      MAPK signalling dynamics in yeast have been shown to be
                      dependent on the net charge of an IDR in Ste50 [
                      <Link
                        inline
                        className="text-md text-muted-foreground"
                        href="https://www.pnas.org/doi/full/10.1073/pnas.1614787114"
                      >
                        Zarin <span className="italic">et al.</span>, 2017.
                        (PNAS)
                      </Link>
                      ]. Multiple studies have shown that charged residue
                      composition and clustering (see patterning section below)
                      are important for IDR hydrodynamic properties and
                      electrostatically-driven phase behaviour [{" "}
                      <Link
                        inline
                        className="text-md text-muted-foreground"
                        href="https://doi.org/10.1016/j.jmb.2021.167373"
                      >
                        Cohan <span className="italic">et al.</span>, 2022.
                        (JMB)
                      </Link>
                      ;{" "}
                      <Link
                        inline
                        className="text-md text-muted-foreground"
                        href="https://doi.org/10.1016/j.molcel.2015.01.013"
                      >
                        Nott <span className="italic">et al.</span>, 2015.
                        (Molecular Cell)
                      </Link>
                      ;{" "}
                      <Link
                        inline
                        className="text-md text-muted-foreground"
                        href="https://doi.org/10.1073/pnas.1304749110"
                      >
                        Das and Pappu, 2013. (PNAS)
                      </Link>
                      ].
                    </p>
                  </li>
                </ul>
              </div>
            </details>
            <details className="rounded-md p-2 gap-2 bg-accent shadow-sm">
              <summary className="text-sm hover:text-foreground">
                What are sequence motifs, or SLiMs?
              </summary>
              <div className="pt-2 px-2.5">
                <span className="underline">S</span>hort{" "}
                <span className="underline">L</span>inear{" "}
                <span className="underline">i</span>nteraction{" "}
                <span className="underline">M</span>otifs, also referred to as
                motifs, are short conserved segments that are about 3-15
                residues long. These segments generally encode recognition
                elements for specific binding domains or enzymes that put on
                post-translational modifications [
                <Link
                  inline
                  className="text-md text-muted-foreground"
                  href="https://pubmed.ncbi.nlm.nih.gov/26589632/"
                >
                  Davey <span className="italic">et al.</span>, 2015. (Springer
                  Nature)
                </Link>
                ]. The collection of motifs used here are a curated subset of
                motifs found at the{" "}
                <Link
                  inline
                  className="text-md text-muted-foreground"
                  href="https://doi.org/10.1093/nar/gkt1047"
                >
                  Eukaryotic Linear Motif (ELM) resource
                </Link>
                . A couple illustrative examples are:
                <ul className="pl-5 py-2 gap-2 flex flex-col">
                  <li>
                    <div className="flex flex-row gap-2">
                      <div className="h-fit rounded-md shadow-sm px-2 border text-muted-foreground">
                        MOD_CK1_1
                      </div>
                      <p>
                        is defined as the number of non-overlapping occurrences
                        of the regex pattern "S..([ST])".
                      </p>
                    </div>
                    <p>
                      The above regex pattern can be more simply described as a
                      serine or threonine preceded by a serine 3 position
                      before. As described in the{" "}
                      <Link
                        inline
                        className="text-md text-muted-foreground"
                        href="http://elm.eu.org/elms/MOD_CK1_1"
                      >
                        ELM entry for MOD_CK1_1
                      </Link>
                      , this motif is phosphorylated by Casein kinase 1. The
                      phosphorylation occurs on the "([ST])" site, primed by a
                      phosphorylation event at the -3 site "S".
                    </p>
                  </li>
                  <li>
                    <div className="flex flex-row gap-2">
                      <div className="h-fit rounded-md shadow-sm px-2 border text-muted-foreground">
                        LIG_CtBP_PxDLS_1
                      </div>
                      <p>
                        is defined as the number of non-overlapping occurrences
                        of the regex pattern
                        "(P[LVIPME][DENS][LM][VASTRG])|(G[LVIPME][DENS][LM][VASTRG]((K)|(.[KR])))".
                      </p>
                    </div>
                    <p>
                      The above regex pattern can be approximately described as
                      a "PxDLS" consensus pattern with more specific additional
                      constraints. As described in the{" "}
                      <Link
                        inline
                        className="text-md text-muted-foreground"
                        href="http://elm.eu.org/elms/LIG_CtBP_PxDLS_1"
                      >
                        ELM entry for LIG_CtBP_PxDLS_1
                      </Link>
                      , this motif is bound by homodimers of{" "}
                      <Link
                        inline
                        className="text-md text-muted-foreground"
                        href="https://www.ebi.ac.uk/interpro/entry/InterPro/IPR043322/"
                      >
                        CtBP family proteins
                      </Link>
                      . The CtBP family are transcriptional corepressors which
                      are recruited to PxDLS motifs on transcriptional
                      regulators involved in diverse pathways.
                    </p>
                  </li>
                </ul>
              </div>
            </details>
            <details className="rounded-md bg-accent p-2 gap-2 shadow-sm">
              <summary className="text-sm hover:text-foreground">
                What is residue patterning?
              </summary>
              <div className="pt-2 px-2.5">
                Patterning (also known as blockiness) describes the degree that
                like residues cluster together in a sequence. The presence of
                large clusters of like residues is known to be important for
                long-range attractive interactions. A couple of illustrative
                examples are:
                <ul className="pl-5 py-2 gap-2 flex flex-col">
                  <li>
                    <div className="flex flex-row gap-2">
                      <div className="h-fit rounded-md shadow-sm px-2 border text-muted-foreground">
                        custom_kappa
                      </div>
                      <p>
                        also known as <span className="italic">κ</span>, is a
                        measure of "charge patterning", or the degree to which
                        the acidic and basic residues in a sequence form acidic
                        or basic "blocks" in a sequence more than expected.
                      </p>
                    </div>
                    <p>
                      The presence of charged blocks is known to be important
                      for the hydrodynamic properties of IDPs due to
                      electrostatic interactions [{" "}
                      <Link
                        inline
                        className="text-md text-muted-foreground"
                        href="https://doi.org/10.1016/j.jmb.2021.167373"
                      >
                        Cohan <span className="italic">et al.</span>, 2022.
                        (JMB)
                      </Link>
                      ;{" "}
                      <Link
                        inline
                        className="text-md text-muted-foreground"
                        href="https://doi.org/10.1016/j.molcel.2015.01.013"
                      >
                        Nott <span className="italic">et al.</span>, 2015.
                        (Molecular Cell)
                      </Link>
                      ;{" "}
                      <Link
                        inline
                        className="text-md text-muted-foreground"
                        href="https://doi.org/10.1073/pnas.1304749110"
                      >
                        Das and Pappu, 2013. (PNAS)
                      </Link>
                      ]. Charge patterning was found to tune interaction
                      specificity in MED1's IDR [
                      <Link
                        inline
                        className="text-md text-muted-foreground"
                        href="https://doi.org/10.1016/j.cell.2022.12.013"
                      >
                        Lyons <span className="italic">et al.</span>, 2024.
                        (Cell)
                      </Link>
                      ].
                    </p>
                  </li>
                  <li>
                    <div className="flex flex-row gap-2">
                      <div className="h-fit rounded-md shadow-sm px-2 border text-muted-foreground">
                        arospacing
                      </div>
                      <p>
                        is a measure of "aromatic patterning", or the degree to
                        which the aromatic residues are clustered closer to each
                        other in the sequence than expected.
                      </p>
                    </div>
                    <p>
                      Aromatic clusters have been shown to promote aggregation.
                      In an IDR of HNRNPA1, aromatic clusters are depleted more
                      than expected by chance, and rearrangement of aromatic
                      residues into clusters induced aggregation [
                      <Link
                        inline
                        className="text-md text-muted-foreground"
                        href="https://doi.org/10.1126/science.aaw8653"
                      >
                        Martin <span className="italic">et al.</span>, 2020.
                        (Science)
                      </Link>
                      ].
                    </p>
                  </li>
                </ul>
              </div>
            </details>
          </div>
        </details>
      </div>
      <div className="border rounded-md border-muted p-2 gap-2 flex flex-col bg-card">
        <details>
          <summary className="text-sm hover:text-foreground">
            What is the evidence that the sequence features used here are
            important for IDRs?
          </summary>
          <div className="pt-2 px-2.5">
            These sequence features are:
            <ol className="list-decimal list-inside">
              <li>
                Conserved across IDR evolution despite low positional sequence
                conservation [
                <Link
                  inline
                  className="text-md text-muted-foreground"
                  href="https://doi.org/10.7554/eLife.46883"
                >
                  Zarin <span className="italic">et al.</span>, 2019 (eLife)
                </Link>
                ].
              </li>
              <li>
                Predictive of IDR function [
                <Link
                  inline
                  className="text-md text-muted-foreground"
                  href="https://doi.org/10.7554/eLife.60220"
                >
                  Zarin <span className="italic">et al.</span>, 2021 (eLife)
                </Link>
                ].
              </li>
              <li>
                Able to define IDR clusters that have significant functional
                enrichments [
                <Link
                  inline
                  className="text-md text-muted-foreground"
                  href="https://doi.org/10.1073/pnas.2604562123"
                >
                  Pritišanac <span className="italic">et al.</span>, 2026 (PNAS)
                </Link>
                ].
              </li>
            </ol>
          </div>
        </details>
      </div>
      <div className="border rounded-md border-muted p-2 bg-card">
        <details>
          <summary className="text-sm hover:text-foreground">
            How can sequence features be used for design?
          </summary>
          <div className="gap-2 flex flex-col px-2.5 pt-2">
            <p>
              By starting with a random seed sequence and iteratively making
              point mutations which minimize a "feature distance" (see glossary)
              to given a target feature vector, sequences that fit a given
              sequence feature profile can be generated. Two variants of
              designed sequences are particularly valuable:
            </p>
            <ul className="flex flex-col gap-2">
              <li className="bg-accent shadow-sm rounded-md p-2">
                <span className="italic">Feature mimics</span> - synthetic
                sequences with a feature vector close to a reference (wild-type,
                extant) sequence. These synthetic sequences are expected to
                behave similarly to the reference sequence if features are
                sufficient to determine IDR function.
              </li>
              <li className="bg-accent shadow-sm rounded-md p-2">
                <span className="italic">Feature knockouts</span> - sequence
                variants of reference sequences whose feature vector perturbs a
                subset of features while keeping the remaining features close to
                their original (reference) value. These synthetic sequences are
                expected to behave differently if the features perturbed are
                necessary for the function of the sequence.
              </li>
            </ul>
            <p>
              Synthetic feature mimics of mitochondrial targeting signals and
              heat-shock dependent phase-separating IDRs that replicate the
              function of the original IDR have been generated [
              <Link
                inline
                className="text-md text-muted-foreground"
                href="https://www.biorxiv.org/content/10.1101/2023.04.28.538739v1"
              >
                Strome <span className="italic">et al.</span>, 2023 (BioRxiv)
              </Link>
              ]. Net charge knockouts of mitochondrial targeting signals which
              demonstrating that net charge is necessary for phase separation
              have also been created (soon-to-be-posted manuscript accompanying
              this software).
            </p>
          </div>
        </details>
      </div>
      <div className="border rounded-md border-muted p-2 bg-card">
        <details>
          <summary className="text-sm hover:text-foreground">Glossary</summary>
          <div className="gap-2 flex flex-col px-2.5 pt-2">
            <div className="gap-2 flex flex-col bg-accent shadow-sm rounded-md p-2">
              <p>
                <span className="italic">IDRome</span> - the complete set of all
                intrinsically disordered proteins and intrinsically disordered
                regions within a given proteome, such as for the human proteome.
              </p>
              <p>
                We use IDRomes to standardize the mean and standard deviation of
                sequence features to z-scores. This way, features with different
                natural ranges (e.g. composition, which are fractions between
                0-1, versus motif counts, which are any positive integer) can be
                compared on the same scale.
              </p>
            </div>
            <div className="gap-2 flex flex-col bg-accent shadow-sm rounded-md p-2">
              <p>
                <span className="italic">Feature Distance</span> - the euclidean
                distance between two vectors of feature z-scores (feature
                vectors) in {NUM_FEATURES} dimensions.
              </p>
              <p>
                Our design approach for feature fitting greedily minimizes the
                feature distance between the designed IDR's feature vector and a
                target feature vector.
              </p>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
