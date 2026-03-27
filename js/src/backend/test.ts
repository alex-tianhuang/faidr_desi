import { backend } from ".";
await backend(
  {
    endpoint: "featurize",
    sequences: ["WALMARTISSEQIWILLDIEFERTHISPRAPHECY"],
    sequenceValidationSettings: {
      minSequenceLength: 30,
      omitMode: "strict",
      capitalizeMode: "strict",
    },
    featureConfiguration: {
      SOME_ID: {
        compute: "isoelectric-point",
      },
    },
    statisticsIncluded: false,
  },
  async (recv) => {
    while (true) {
      const msg = await recv();
      console.log(msg);
      if (msg.case !== "yield") return;
    }
  },
);
await backend(
  {
    endpoint: "generate-mimic",
    targetSequence: "WALMARTISSEQIWILLDIEFERTHISPRAPHECY",
    sequenceValidationSettings: {
      minSequenceLength: 30,
      omitMode: "strict",
      capitalizeMode: "strict",
    },
    featureConfiguration: {
      SOME_ID: {
        compute: "isoelectric-point",
      },
    },
    featureWeights: {
      SOME_ID: 1,
    },
    rng: {
      seed: 42,
    },
  },
  async (recv) => {
    while (true) {
      const msg = await recv();
      console.log(msg);
      if (msg.case !== "yield") return;
    }
  },
);
await backend(
  {
    endpoint: "generate-ko",
    initialSequence: "WALMARTISSEQIWILLDIEFERTHISPRAPHECY",
    sequenceValidationSettings: {
      minSequenceLength: 30,
      omitMode: "strict",
      capitalizeMode: "strict",
    },
    featureConfiguration: {
      SOME_ID: {
        compute: "isoelectric-point",
      },
    },
    featureWeights: {
      SOME_ID: 1,
    },
    featureTargets: {
      SOME_ID: 11,
    },
  },
  async (recv) => {
    while (true) {
      const msg = await recv();
      console.log(msg);
      if (msg.case !== "yield") return;
    }
  },
);
