export default function Faqs() {
  return (
    <div className="flex flex-col border border-input rounded-md p-4 gap-2">
      <p className="font-bold underline">FAQs</p>
      <div className="border border-muted rounded-md bg-card p-2 text-muted-foreground">
        <details>
          <summary className="text-sm hover:text-foreground">
            Why is it useful to make designs that mimic features?
          </summary>
          <p className="pt-2 px-2.5 text-justify">
            It has been shown (see Background Concepts) that sequence features
            can be predictive of IDR function. Therefore, it is natural to
            hypothesize that in some biological or experimental systems,
            sequence features are <span className="italic">sufficient</span> to
            determine an IDR's behaviour. By designing a sequence with very
            similar features to your input sequence,{" "}
            <span className="underline">
              one expects that "feature mimic" sequences{" "}
              <span className="italic">would</span> recapitulate functional
              properties of your input sequence.
            </span>
          </p>
        </details>
      </div>
      <div className="border border-muted rounded-md bg-card p-2 text-muted-foreground">
        <details>
          <summary className="text-sm hover:text-foreground">
            Why is there an IDRome involved?
          </summary>
          <p className="pt-2 px-2.5 text-justify">
            When our algorithm matches the designed sequence's features to your
            input sequence's features, we minimize over a Euclidean distance in
            feature space between the two feature vectors. We use IDRomes to
            standardize the mean and standard deviation of sequence features to
            feature z-scores. This way, features with different natural ranges
            (e.g., composition, which is a fraction between 0-1, and motif
            count, which can be any non-negative integer) can be compared on the
            same scale.
          </p>
        </details>
      </div>
      <div className="border border-muted rounded-md bg-card p-2 text-muted-foreground">
        <details>
          <summary className="text-sm hover:text-foreground">
            Why is there a random initial sequence / RNG seed involved?
          </summary>
          <p className="pt-2 px-2.5 text-justify">
            To remove the effect of sequence homology from this experiment, we
            begin with a randomly generated initial amino acid string (which is
            not expected to have any functional similarities to the input
            sequence) and greedily match features. The designed sequence usually
            has very low sequence homology to the input sequence when designing
            this way.
          </p>
        </details>
      </div>
    </div>
  );
}
