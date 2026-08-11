import type React from "react";
import RedirectToFeatureMetadata from "./redirectToFeatureMetadata";

export default function BackgroundConcepts(props: {
  featureMetadataRef: React.RefObject<HTMLDetailsElement | null>;
}) {
  const { featureMetadataRef } = props;
  return (
    <div className="border rounded-md border-muted p-3 gap-2 flex flex-col text-muted-foreground">
      <p className="flex-1 text-md font-bold text-foreground underline">
        Background Concepts
      </p>
      <div className="border rounded-md border-muted p-2 gap-2 flex flex-col">
        <details>
          <summary>What are IDRs?</summary>
          <span className="underline">I</span>ntrinsically{" "}
          <span className="underline">D</span>isordered protein{" "}
          <span className="underline">R</span>egions (IDRs) are proteins or
          regions of proteins without stable tertiary structure. They are
          involved in critical biological processes such as protein phase
          separation [Link], subcellular localization targeting [Link], and
          transcriptional regulation [Link]. IDR variants have been implicated
          in disease mechanisms for neurodegenerative diseases and cancers
          [Link].
        </details>
      </div>
      <div className="border rounded-md border-muted p-2 gap-2 flex flex-col">
        <details>
          <summary>What are sequence features, generally?</summary>
          <div className="gap-2 flex flex-col">
            Sequence features are simple patterns you can see in a sequence.
            Whereas the conserved elements of folded peptides are commonly
            extractable via multiple sequence alignments (using algorithms such
            as BLAST and HMmer [cite]), many IDRs are not subject to
            evolutionary constraints at the primary sequence level. Instead, it
            has been shown that IDRs conserve certain sequence features that are
            aggregate properties over the whole IDR [cite]. Some categories of
            sequence features that have been studied are described below:
            <details className="border rounded-md border-muted p-2 gap-2">
              <summary className="underline font-semibold">Composition</summary>
              Composition describes the percentage of a sequence that is one
              kind of aminoacid, or combinations of them. Among other functions,
              the composition profile of an IDR is known to be strongly
              determinant of its ability to form phase separated[link]
              condensates and encode chemical specificity of those condensates
              [link]. A couple illustrative examples are:
              <ul className="pl-5 py-2 gap-2 flex flex-col">
                <li>
                  <p>
                    <span className="italic">AA_F</span> is defined as the
                    percentage of sequence made of phenylalanine.
                  </p>
                  <p>
                    Phenylalanine, being a large hydrophobic aminoacid, is known
                    to form non-specific hydrophobic interactions which are
                    important for pi-pi and pi-cation mediated phase separation
                    [link]. For example, FG-Nucleoporins, which have IDRs that
                    form a condensed phase at the nuclear pore, are enriched in
                    phenylalanine and glycine. It is known[believed?] that this
                    phenylalanine-enriched condensed phase enables the nuclear
                    pore to have specificity for cargo that can form hydrophobic
                    interactions with the phenylalanines in the FG-Nucleoporins
                    [link].
                  </p>
                </li>
                <li>
                  <p>
                    <span className="italic">NCPR</span> or{" "}
                    <span className="underline">N</span>et{" "}
                    <span className="underline">C</span>harge{" "}
                    <span className="underline">P</span>er{" "}
                    <span className="underline">R</span>esidue, is defined as
                    the percentage of basic residues (lysine/arginine) minus the
                    percentage of acidic residues (glutamine/asparagine) in the
                    sequence.
                  </p>
                  <p>
                    Charged residues, which drive electrostatic interactions,
                    are important in various biological systems. For example,
                    MAPK signalling dynamics in yeast have been shown to be
                    dependent on the net charge of and IDR in Ste50[cite].
                    Multiple studies have shown that charged residue composition
                    and clustering (see{" "}
                    <span className="underline">Spacing/Patterning</span>{" "}
                    section below) are important for IDR shape, size, and
                    electrostatically-driven phase behaviour [cite Pappu and
                    Julie].
                  </p>
                </li>
              </ul>
            </details>
            <details className="border rounded-md border-muted p-2 gap-2">
              <summary className="underline font-semibold">
                Motifs/SLiMs
              </summary>
              <span className="underline">S</span>hort{" "}
              <span className="underline">L</span>inear{" "}
              <span className="underline">i</span>nteraction{" "}
              <span className="underline">M</span>otifs, also referred to as
              motifs, are short conserved segments that are about 3-15 residues
              long. These segments generally encode highly specific binding or
              post-translational modification sites [Davey et al.]. Our
              collection of motifs are a curated subset of motifs found at the
              Eukaryotic Linear Motif (ELM) resource. A couple illustrative
              examples are:
              <ul className="pl-5 py-2 gap-2 flex flex-col">
                <li>
                  <p>
                    <span className="italic">MOD_CK1_1</span> is defined as the
                    number non-overlapping occurrences of the regex pattern
                    "S..([ST])".
                  </p>
                  <p>
                    The above regex pattern can be more simply described as any
                    serine/threonine preceded by a serine 3 sites before. As
                    described in http://elm.eu.org/elms/MOD_CK1_1, this motif is
                    phosphorylated by Casein kinase 1. The phosphorylation
                    occurs on the "([ST])" site, primed by a phosphorylation
                    event at the -3 site "S" [cite].
                  </p>
                </li>
                <li>
                  <p>
                    <span className="italic">LIG_CtBP_PxDLS_1</span> is defined
                    as the number non-overlapping occurrences of the regex
                    pattern
                    "(P[LVIPME][DENS][LM][VASTRG])|(G[LVIPME][DENS][LM][VASTRG]((K)|(.[KR])))".
                  </p>
                  <p>
                    The above regex pattern can be approximately described as a
                    "PxDLS" consensus pattern with more specific additional
                    constraints. As described in
                    http://elm.eu.org/elms/LIG_CtBP_PxDLS_1, this motif is bound
                    by homodimers of CtBP family proteins
                    (https://www.ebi.ac.uk/interpro/entry/InterPro/IPR043322/).
                    The CtBP family are transcriptional corepressors which are
                    recruited to PxDLS motifs on transcriptional regulators
                    involved in diverse pathways [cite].
                  </p>
                </li>
              </ul>
            </details>
            <details className="border rounded-md border-muted p-2 gap-2">
              <summary className="underline font-semibold">
                Spacing/Patterning
              </summary>
              Spacing or patterning describes the degree that like residues
              cluster together in a sequence. The presence of large clusters of
              like residues is known to be important for long-range attractive
              interactions. A couple illustrative examples are:
              <ul className="pl-5 py-2 gap-2 flex flex-col">
                <li>
                  <p>
                    <span className="italic">κ</span> or{" "}
                    <span className="italic">custom_kappa</span> is a measure of
                    "charge patterning", or the degree to which the acidic and
                    basic residues in a sequence form acidic or basic "blocks"
                    in a sequence more than expected.
                  </p>
                  <p>
                    The presence of charged blocks are known to be important for
                    the size and shape of IDPs due to the formation of
                    long-range intrachain charge-charge contacts [Pappu/JDFK].
                    Charge patterning of an IDR can also tune interaction
                    specificity in MED1's IDR[IDP?].
                  </p>
                </li>
                <li>
                  <p>
                    <span className="italic">arospacing</span> is a measure of
                    "aromatic patterning", or the degree to which the aromatic
                    residues are closer to each other in the sequence than
                    expected.
                  </p>
                  <p>
                    Aromatic clusters have been shown to promote aggregation in
                    a model PLD system. In HNRNPA1's LCD, aromatic clusters are
                    depleted more than expected by chance, and rearrangement of
                    aromatic residues in the LCD into clusters induced
                    aggregation
                    [https://www.science.org/doi/10.1126/science.aaw8653].
                  </p>
                </li>
              </ul>
            </details>
          </div>
        </details>
      </div>
      <div className="border rounded-md border-muted p-2 gap-2 flex flex-col">
        <RedirectToFeatureMetadata featureMetadataRef={featureMetadataRef} />
      </div>
      <div className="border rounded-md border-muted p-2 gap-2 flex flex-col">
        <details>
          <summary>
            Why do we think sequence features important for IDRs?
          </summary>
          Our lab showed that sequence features are
          <ul>
            <li>
              (1) Conserved across IDR evolution despite low primary sequence
              conservation [Zarin 2019 Elife]
            </li>
            <li>(2) Predictive of IDR function [Zarin 2021 Elife] </li>
            <li>
              (3) Able to make IDR clusters that have significant functional
              enrichments. [Pritisanac 2026 PNAS]
            </li>
          </ul>
        </details>
      </div>
      <div className="border rounded-md border-muted p-2 gap-2 flex flex-col">
        <details>
          <summary>How do we use sequence features for design?</summary>
          By starting with a random seed sequence and iteratively making point
          mutations which fit a target feature vector, we can generate sequences
          that fit a given sequence feature profile. This allows us to define
          two variants of sequences:
          <ul>
            <li>
              1. (feature mimic) Synthetic sequences with a feature vector close
              to an reference (wild-type, extant) sequence. These synthetic
              sequences should be expected to behave similarly as the reference
              sequence if features are sufficient to determine IDR function.
            </li>
            <li>
              2. (feature knockout) Sequence variants of reference sequences
              whose feature vector perturbs a subset of features while keeping
              the remaining features close to their original (reference) value.
              These synthetic sequences should be expected to behave differently
              if the features perturbed are necessary for the function of the
              sequence.
            </li>
          </ul>
          Our lab has created synthetic feature mimics of mitochondrial
          targeting signals and heat-shock dependent phase separating IDRs that
          replicate the function of the original IDR []. In an accompanying
          manuscript for this software, we also created net charge knockouts of
          mitochondrial targeting signals which demonstrated that net charge is
          necessary for phase separation [].
        </details>
      </div>
    </div>
  );
}
