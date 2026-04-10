// Run the harness for compute tests.
//
// The test running harness was setup by Claude
// and it lets me test the `communicate` function
// in a webworker like in production.
import { test as test_, expect } from "@playwright/test";
export const test = test_.extend({
  page: async ({ page }, use) => {
    await page.goto("tests/harness/index.html");
    await page.waitForFunction(() => window.__ready === true);
    await use(page);
  },
});
export { expect }
