import { SEQUENCE_VALIDATION_PARAMETERS } from "@/lib/consts";
import FEATURE_CONFIGURATION from "./data/kl_feature_configuration";
import { test, expect } from "./fixtures";
import TEST_SEQUENCE from "./data/featurize/test_sequence";
import EXPECTED_FEATURE_VALUES from "./data/featurize/expected_feature_values";

test("features can reproduce old implementation", async ({ page }) => {
  const result = await page.evaluate(
    async (imports) => {
      const {
        FEATURE_CONFIGURATION,
        SEQUENCE_VALIDATION_PARAMETERS,
        TARGET_SEQUENCE,
      } = imports;
      const request = {
        endpoint: "featurize",
        sequences: [TARGET_SEQUENCE],
        featureConfiguration: FEATURE_CONFIGURATION,
        sequenceValidationSettings: SEQUENCE_VALIDATION_PARAMETERS,
        statisticsIncluded: false,
      };
      return await window.__communicate(request);
    },
    {
      FEATURE_CONFIGURATION,
      SEQUENCE_VALIDATION_PARAMETERS,
      TARGET_SEQUENCE: TEST_SEQUENCE,
    },
  );
  expect(result.error).toBeNull();
  expect(result.closed).toEqual({ case: "ok" });
  expect(result.yielded[0]).toEqual({
    featureCompileErrors: {},
    modifiedSequences: {},
    phase: "initialized",
    sequenceValidationErrors: {},
    statisticsIncluded: false,
  });
  expect(result.yielded.length).toEqual(2);
  const { phase: progress, sequenceByFeatureMatrix } = result.yielded[1] as any;
  expect(progress).toEqual("progress");
  expect(sequenceByFeatureMatrix).toHaveProperty("0");
  const initialFeaturized = sequenceByFeatureMatrix["0"];
  for (const [featureID, result] of Object.entries(initialFeaturized)) {
    const expectedValue = (EXPECTED_FEATURE_VALUES as Record<string, number>)[
      featureID
    ];
    const { case: ok_or_err, value } = result as any;
    expect(ok_or_err).toEqual("ok");
    expect(value).toBeCloseTo(expectedValue);
  }
});
