/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

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
