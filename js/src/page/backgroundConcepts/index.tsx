import Link from "@/components/link";
import RedirectToFeatureMetadata from "./redirectToFeatureMetadata";

export default function BackgroundConcepts() {
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
            <span className="underline">R</span>egions (IDRs) are proteins or
            regions of proteins without stable tertiary structure. They are
            involved in critical biological processes such as protein phase
            separation, subcellular localization targeting, and transcriptional
            regulation [
            <Link
              inline
              href="https://doi.org/10.1021/cr400525m"
              className="text-md text-muted-foreground"
            >
              Van Der Lee <span className="italic">et al.</span>, 2014. (ACS)
            </Link>
            ]. IDR variants have been implicated in disease mechanisms for
            neurodegenerative diseases and cancers [
            <Link
              inline
              className="text-md text-muted-foreground"
              href="https://doi.org/10.1038/s41392-021-00678-1"
            >
              Wang <span className="italic">et al.</span>, 2021. (Nature)
            </Link>
            ].
          </div>
        </details>
      </div>
      <div className="border rounded-md border-muted p-2 gap-2 flex flex-col bg-card">
        <details>
          <summary className="text-sm hover:text-foreground">
            What are sequence features, generally?
          </summary>
          <div className="gap-2 flex flex-col py-2 px-2.5">
            <span>
              Sequence features are simple patterns you can see in a sequence.
              Whereas the conserved elements of folded peptides are commonly
              extractable via multiple sequence alignments (using algorithms
              such as{" "}
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
              ]. Some categories of sequence features that have been studied are
              described below:
            </span>
            <details className="rounded-md p-2 gap-2 bg-accent shadow-sm">
              <summary className="text-sm hover:text-foreground">
                What is sequence composition?
              </summary>
              <div className="px-2.5 pt-2">
                Composition describes the percentage of a sequence that is one
                kind of aminoacid, or combinations of them. Among other
                functions, the composition profile of an IDR is known to be
                strongly determinant of its ability to form phase separated
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
                        is defined as the percentage of sequence made of
                        phenylalanine.
                      </p>
                    </div>
                    <p>
                      Phenylalanine, being a large hydrophobic aminoacid, is
                      known to form non-specific hydrophobic interactions which
                      are important for pi-pi and pi-cation mediated phase
                      separation [
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
                      phenylalanine and glycine. It has been shown that this
                      phenylalanine-enriched condensed phase enables the nuclear
                      pore to have specificity for cargo that can form
                      hydrophobic interactions with the phenylalanines in the
                      FG-Nucleoporins [
                      <Link
                        inline
                        className="text-md text-muted-foreground"
                        href="https://doi.org/10.1039/d3cp03746k"
                      >
                        Patel <span className="italic">et al.</span>, 2023.
                        (RSC)
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
                      are important in various biological systems. For example,
                      MAPK signalling dynamics in yeast have been shown to be
                      dependent on the net charge of and IDR in Ste50 [
                      <Link
                        inline
                        className="text-md text-muted-foreground"
                        href="https://www.pnas.org/doi/full/10.1073/pnas.1614787114"
                      >
                        Zarin <span className="italic">et al.</span>, 2017.
                        (PNAS)
                      </Link>
                      ]. Multiple studies have shown that charged residue
                      composition and clustering (see{" "}
                      <span className="underline">Spacing/Patterning</span>{" "}
                      section below) are important for IDR shape, size, and
                      electrostatically-driven phase behaviour [
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
                        href="https://doi.org/10.1016/j.jmb.2021.167373"
                      >
                        Cohan <span className="italic">et al.</span>, 2022.
                        (JMB)
                      </Link>
                      ].
                    </p>
                  </li>
                </ul>
              </div>
            </details>
            <details className="rounded-md p-2 gap-2 bg-accent shadow-sm">
              <summary className="text-sm hover:text-foreground">
                What are motifs, or SLiMs?
              </summary>
              <div className="pt-2 px-2.5">
                <span className="underline">S</span>hort{" "}
                <span className="underline">L</span>inear{" "}
                <span className="underline">i</span>nteraction{" "}
                <span className="underline">M</span>otifs, also referred to as
                motifs, are short conserved segments that are about 3-15
                residues long. These segments generally encode highly specific
                binding or post-translational modification sites [
                <Link
                  inline
                  className="text-md text-muted-foreground"
                  href="https://pubmed.ncbi.nlm.nih.gov/26589632/"
                >
                  Davey <span className="italic">et al.</span>, 2015. (Springer
                  Nature)
                </Link>
                ]. Our collection of motifs are a curated subset of motifs found
                at the{" "}
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
                        is defined as the number non-overlapping occurrences of
                        the regex pattern "S..([ST])".
                      </p>
                    </div>
                    <p>
                      The above regex pattern can be more simply described as
                      any serine/threonine preceded by a serine 3 sites before.
                      As described in the{" "}
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
                        defined as the number non-overlapping occurrences of the
                        regex pattern
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
                What is residue spacing/patterning?
              </summary>
              <div className="pt-2 px-2.5">
                Spacing or patterning describes the degree that like residues
                cluster together in a sequence. The presence of large clusters
                of like residues is known to be important for long-range
                attractive interactions. A couple illustrative examples are:
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
                      The presence of charged blocks are known to be important
                      for the size and shape of IDPs due to the formation of
                      long-range intrachain charge-charge contacts [
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
                        href="https://doi.org/10.1016/j.jmb.2021.167373"
                      >
                        Cohan <span className="italic">et al.</span>, 2022.
                        (JMB)
                      </Link>
                      ]. Charge patterning of an IDR can also tune interaction
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
                        which the aromatic residues are closer to each other in
                        the sequence than expected.
                      </p>
                    </div>
                    <p>
                      Aromatic clusters have been shown to promote aggregation
                      in a model PLD system. In HNRNPA1's LCD, aromatic clusters
                      are depleted more than expected by chance, and
                      rearrangement of aromatic residues in the LCD into
                      clusters induced aggregation [
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
        <RedirectToFeatureMetadata />
      </div>
      <div className="border rounded-md border-muted p-2 gap-2 flex flex-col bg-card">
        <details>
          <summary className="text-sm hover:text-foreground">
            Why do we think <span className="italic">these</span> sequence
            features are important for IDRs?
          </summary>
          <div className="pt-2 px-2.5">
            Our lab showed that these sequence features are:
            <ol className="list-decimal list-inside">
              <li>
                Conserved across IDR evolution despite low primary sequence
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
            How do we use sequence features for design?
          </summary>
          <div className="gap-2 flex flex-col px-2.5 pt-2">
            <p>
              By starting with a random seed sequence and iteratively making
              point mutations which fit a target feature vector, we can generate
              sequences that fit a given sequence feature profile. This allows
              us to define two variants of sequences:
            </p>
            <ul className="flex flex-col gap-2">
              <li className="bg-accent shadow-sm rounded-md p-2">
                <span className="italic">Feature mimics</span> - synthetic
                sequences with a feature vector close to an reference
                (wild-type, extant) sequence. These synthetic sequences should
                be expected to behave similarly as the reference sequence if
                features are sufficient to determine IDR function.
              </li>
              <li className="bg-accent shadow-sm rounded-md p-2">
                <span className="italic">Feature knockouts</span> - sequence
                variants of reference sequences whose feature vector perturbs a
                subset of features while keeping the remaining features close to
                their original (reference) value. These synthetic sequences
                should be expected to behave differently if the features
                perturbed are necessary for the function of the sequence.
              </li>
            </ul>
            <p>
              Our lab has created synthetic feature mimics of mitochondrial
              targeting signals and heat-shock dependent phase separating IDRs
              that replicate the function of the original IDR [
              <Link
                inline
                className="text-md text-muted-foreground"
                href="https://www.biorxiv.org/content/10.1101/2023.04.28.538739v1"
              >
                Strome <span className="italic">et al.</span>, 2023 (BioRxiv)
              </Link>
              ]. In a soon to be posted manuscript accompanying this software,
              we also created net charge knockouts of mitochondrial targeting
              signals which demonstrated that net charge is necessary for phase
              separation.
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}
