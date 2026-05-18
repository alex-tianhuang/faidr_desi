import { SEQUENCE_VALIDATION_PARAMETERS } from "@/lib/consts";
import FEATURE_CONFIGURATION from "./data/kl_feature_configuration";
import { test, expect } from "./fixtures";
import TEST_SEQUENCES from "./data/featurize/test_sequences";
import EXPECTED_FEATURE_VALUES from "./data/featurize/expected_feature_values";

test("features can reproduce old implementation", async ({ page }) => {
  const result = await page.evaluate(
    async (imports) => {
      const {
        FEATURE_CONFIGURATION,
        SEQUENCE_VALIDATION_PARAMETERS,
        TARGET_SEQUENCES,
      } = imports;
      const request = {
        endpoint: "featurize",
        sequences: TARGET_SEQUENCES,
        featureConfiguration: FEATURE_CONFIGURATION,
        sequenceValidationSettings: SEQUENCE_VALIDATION_PARAMETERS,
        statisticsIncluded: false,
      };
      return await window.__communicate(request);
    },
    {
      FEATURE_CONFIGURATION,
      SEQUENCE_VALIDATION_PARAMETERS,
      TARGET_SEQUENCES: TEST_SEQUENCES,
    },
  );
  expect(result.error).toBeNull();
  expect(result.closed).toEqual({ case: "ok" });
  expect(result.yielded[0]).toEqual({
    modifiedSequences: {},
    phase: "initialized",
    sequenceValidationErrors: {},
    statisticsIncluded: false,
  });
  const results = new Array(EXPECTED_FEATURE_VALUES.length);
  for (const yielded of result.yielded.slice(1)) {
    const { phase: progress, sequenceByFeatureMatrix } = yielded as any;
    expect(progress).toEqual("progress");
    for (const [index, featureVector] of Object.entries(sequenceByFeatureMatrix)) {
      results[Number(index)] = featureVector;
    }
  }
  for (const [idx, featureVector] of results.entries()) {
    for (const [featureID, result] of Object.entries(featureVector)) {
      const expectedValue = (EXPECTED_FEATURE_VALUES[idx] as Record<string, number>)[
        featureID
      ];
      const { case: ok_or_err, value } = result as any;
      expect(ok_or_err).toEqual("ok");
      expect(value).toBeCloseTo(expectedValue);
    }
  }  
});
