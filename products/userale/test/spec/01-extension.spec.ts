import { test, expect } from "./fixtures/extension.fixture";

test.describe("Userale extension", () => {
  test("doesn't log by default", async ({ page, waitForPostRequest }) => {
    const timeout = 3000;
    const postPromise = waitForPostRequest();

    await page.goto("./");
    for (let i = 0; i < 5; i++) {
      await page.getByText("Click Me!", { exact: true }).click();
    }

    const result = await Promise.race([
      postPromise.then(() => "request-made"),
      new Promise((resolve) => setTimeout(() => resolve("no-request"), timeout)),
    ]);

    expect(result).toBe("no-request");
  });

  test("can change url filter", async ({ page, extensionId, waitForPostRequest }) => {
    const postPromise = waitForPostRequest();

    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await page.locator("#allowlist").fill(".*");
    await page.getByRole("button", { name: "Save Changes" }).click();

    await page.goto("./");
    for (let i = 0; i < 5; i++) {
      await page.getByText("Click Me!", { exact: true }).click();
    }

    const req = await postPromise;
    const body = req.postDataJSON();

    expect(Array.isArray(body)).toBe(true);
  });
});
