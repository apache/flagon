import { test, expect } from "./fixtures/extension.fixture";

test.describe("Userale custom logging", () => {
  test("executes added callbacks", async ({ page, waitForPostRequest }) => {
    const postPromise = waitForPostRequest();

    await page.goto("./");
    for (let i = 0; i < 10; i++) {
      await page.getByText("Click Me!", { exact: true }).click();
    }

    const req = await postPromise;
    const body = req.postDataJSON();

    const buttonClickLog = body.find(
      (log: any) =>
        log.target === "button#test_button" && log.logType === "custom"
    );

    expect(buttonClickLog).toHaveProperty("customLabel");

    const actualValue = buttonClickLog.customLabel;
    const expectedValue = "map & packageLog Example";
    expect(actualValue).toBe(expectedValue);
  });
});
