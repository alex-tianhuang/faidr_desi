import FEATURE_CONFIGURATION from "./data/kl_feature_configuration";
import { test, expect } from "./fixtures";
import TEST_SEQUENCES from "./data/featurize/test_sequences";
import EXPECTED_FEATURE_VALUES from "./data/featurize/expected_feature_values";

test("features can reproduce old implementation", async ({ page }) => {
  const responses = await page.evaluate(
    async (imports) => {
      const { FEATURE_CONFIGURATION, TARGET_SEQUENCES } = imports;
      const responses = [];
      for (const sequence of TARGET_SEQUENCES) {
        const request = {
          endpoint: "featurize",
          sequence,
          featureConfiguration: FEATURE_CONFIGURATION,
        };
        const response = await window.__communicate(request);
        responses.push(response);
      }
      return responses;
    },
    {
      FEATURE_CONFIGURATION,
      TARGET_SEQUENCES: TEST_SEQUENCES,
    },
  );
  for (const [idx, response] of responses.entries()) {
    expect(response.error).toBeNull();
    expect(response.yielded.length).toEqual(0);
    const { data, case: _case } = response.closed as any;
    expect(_case).toEqual("ok");
    for (const [featureID, result] of Object.entries(data)) {
      const expectedValue = (
        EXPECTED_FEATURE_VALUES[idx] as Record<string, number>
      )[featureID];
      const { case: ok_or_err, value } = result as any;
      expect(ok_or_err).toEqual("ok");
      expect(value).toBeCloseTo(expectedValue);
    }
  }
});
