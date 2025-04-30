/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { test, expect } from "./fixtures/extension.fixture";

test.beforeEach(async ({ page }) => {
  const requestPromise = page.waitForRequest(
    (request) => request.method() === "POST",
  );
  await page.goto("./");
  await requestPromise;
});

test.describe("Userale custom logging", () => {
  test("executes added callbacks", async ({ page }) => {
    const requestPromise = page.waitForRequest(
      (request) => request.method() === "POST",
    );
    await page.getByText("Click Me!", { exact: true }).click();
    const request = await requestPromise;
    const body = await request.postDataJSON();

    const buttonClickLog = body.find(
      (log: { target: string; logType: string }) =>
        log.target === "button#test_button" && log.logType === "custom",
    );
    expect(buttonClickLog).toHaveProperty("customLabel");

    const actualValue = buttonClickLog.customLabel;
    const expectedValue = "map & packageLog Example";
    expect(actualValue).toBe(expectedValue);
  });
});
