import { SEQUENCE_VALIDATION_PARAMETERS } from "@/lib/consts";
import FEATURE_CONFIGURATION from "./data/kl_feature_configuration";
import { FEATURE_WEIGHTS } from "./data/kl_design_weights";
import ITERATIONS from "./data/generateMimic/design_iterations.seed-2024";
import TARGET_SEQUENCE from "./data/generateMimic/target_sequence";
import INITIAL_SEQUENCE from "./data/generateMimic/initial_sequence.seed-2024";
import { test, expect } from "./fixtures";
import { Progress as GenerateMimicProgress } from "@/features/generateMimic/types";

test("greedy design algorithm can reproduce old implementation", async ({ page }) => {
  const result = await page.evaluate(
    async (imports) => {
      const {
        FEATURE_CONFIGURATION,
        FEATURE_WEIGHTS,
        SEQUENCE_VALIDATION_PARAMETERS,
        TARGET_SEQUENCE,
      } = imports;
      const rng = {
        seed: 2024,
      };

      const request = {
        endpoint: "generate-mimic",
        targetSequence: TARGET_SEQUENCE,
        featureConfiguration: FEATURE_CONFIGURATION,
        featureWeights: FEATURE_WEIGHTS,
        rng,
        sequenceValidationSettings: SEQUENCE_VALIDATION_PARAMETERS,
      };
      return await window.__communicate(request);
    },
    {
      FEATURE_CONFIGURATION,
      FEATURE_WEIGHTS,
      SEQUENCE_VALIDATION_PARAMETERS,
      TARGET_SEQUENCE,
    },
  );

  expect(result.error).toBeNull();
  expect(result.closed).toEqual({ case: "ok" });
  const { case: initialized, sequence: initialSequence } = result
    .yielded[0] as any;
  expect(initialized).toEqual("initialized");
  expect(initialSequence).toEqual(INITIAL_SEQUENCE);
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