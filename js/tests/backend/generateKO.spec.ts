import { SEQUENCE_VALIDATION_PARAMETERS } from "@/lib/consts";
import FEATURE_CONFIGURATION from "./data/kl_feature_configuration";
import { FEATURE_WEIGHTS } from "./data/kl_design_weights";
import ITERATIONS from "./data/generateKO/design_iterations.ko-net_charge";
import TEST_SEQUENCE from "./data/generateKO/test_sequence";
import KO_FEATURE_TARGETS from "./data/generateKO/kl_ko_values_min";
import { test, expect } from "./fixtures";
import { Progress as GenerateMimicProgress } from "@/features/generateMimic/types";
import type { Featurized } from "@/features/featurize/types";
import scratch from "./data/generateKO/scratch";

test("simple knockout design algorithm can reproduce old implementation", async ({ page }) => {
  // console.log(scratch)
  // throw new Error()
  const result = await page.evaluate(
    async (imports) => {
      const {
        FEATURE_CONFIGURATION,
        FEATURE_WEIGHTS,
        SEQUENCE_VALIDATION_PARAMETERS,
        INITIAL_SEQUENCE,
        KO_FEATURE_TARGETS 
      } = imports;
      const {yielded} = await window.__communicate({
        endpoint: "featurize",
        sequences: [INITIAL_SEQUENCE],
        featureConfiguration: FEATURE_CONFIGURATION,
        sequenceValidationSettings: SEQUENCE_VALIDATION_PARAMETERS,
        statisticsIncluded: false,
      });
      const { sequenceByFeatureMatrix: { "0": initialSequenceFeatures } } = yielded[1] as any;
      const featureTargets: Record<string, number> = {};
      for (const [featureID, featurized] of Object.entries(initialSequenceFeatures as Record<string, Featurized>)) {
        if (featurized.case !== "ok") {
          throw new Error("could not set up target vector for KO test")
        }
        featureTargets[featureID] = featurized.value
      }
      
      const FEATURE_TO_TEST_KO_OF = "net_charge"
      featureTargets[FEATURE_TO_TEST_KO_OF] = KO_FEATURE_TARGETS[FEATURE_TO_TEST_KO_OF];

      const request = {
        endpoint: "generate-ko",
        initialSequence: INITIAL_SEQUENCE,
        featureConfiguration: FEATURE_CONFIGURATION,
        featureWeights: FEATURE_WEIGHTS,
        featureTargets,
        sequenceValidationSettings: SEQUENCE_VALIDATION_PARAMETERS,
      };
      return await window.__communicate(request);
    },
    {
      FEATURE_CONFIGURATION,
      FEATURE_WEIGHTS,
      SEQUENCE_VALIDATION_PARAMETERS,
      INITIAL_SEQUENCE: TEST_SEQUENCE,
      KO_FEATURE_TARGETS
    },
  );

  expect(result.error).toBeNull();
  expect(result.closed).toEqual({ case: "ok" });
  const { case: initialized } = result
    .yielded[0] as any;
  expect(initialized).toEqual("initialized");
  const iterationSequences = ([] as string[]).concat(
    ...result.yielded.slice(1).map((item) => {
      const { case: progress } = item as any;
      expect(progress).toEqual("progress");
      const { iterations } = GenerateMimicProgress.parse(item);
      return iterations.map((iter) => iter.sequence);
    }),
  );
  const expectedSequences = ITERATIONS;
  const n = Math.min(iterationSequences.length, expectedSequences.length);
  for (let i = 0; i < n; i++) {
    expect({
      sequence: iterationSequences[i],
      iter: i + 1,
    }).toEqual({
      sequence: expectedSequences[i],
      iter: i + 1,
    });
  }
  expect(iterationSequences.length).toEqual(expectedSequences.length);
});