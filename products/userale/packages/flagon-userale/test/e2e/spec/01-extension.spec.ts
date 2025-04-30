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
import { errors } from "@playwright/test";
import { Logging } from "@/types";

test.describe("Userale extension", () => {
  test("doesn't log by default", async ({ page, sender }) => {
    try {
      const requestPromise = sender.waitForRequest(
        (request) => request.method() === "POST",
        { timeout: 15000 },
      );
      await page.goto("./");
      for (let i = 0; i < 5; i++) {
        await page.getByText("Click Me!", { exact: true }).click();
      }
      await requestPromise;
      throw new Error("request made");
    } catch (err) {
      expect(err).toBeInstanceOf(errors.TimeoutError);
    }
  });

  test("can change url filter", async ({ sender, page, extensionId }) => {
    const requestPromise = sender.waitForRequest(
      (request) => request.method() === "POST",
    );
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    // Sleep so options.js can update the html with values from local storage.
    await new Promise((r) => setTimeout(r, 1000));
    await page.fill("#filter", ".*");
    await page.click("#submitOptions");
    await page.goto("./");
    for (let i = 0; i < 5; i++) {
      await page.getByText("Click Me!", { exact: true }).click();
    }
    // The completion of this promise means data was logged and the test passes.
    await requestPromise;
  });

  test("can change loging options", async ({ sender, page, extensionId }) => {
    let id = "testUser";

    const requestPromise = sender.waitForRequest((request) => {
      const postData = request.postData();
      return Boolean(postData && postData.includes("testUser"));
    });
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await page.waitForLoadState("load");
    await page.fill("#user", id);
    await page.click("#submitOptions");
    await page.goto("./");
    for (let i = 0; i < 5; i++) {
      await page.getByText("Click Me!", { exact: true }).click();
    }

    const request = await requestPromise;
    const body = await request.postDataJSON();
    const log = body.find((log: Logging.JSONObject) => log.userId === id);

    expect(log).toBeTruthy;
  });

  test("can submit an issue report", async ({
    context,
    sender,
    page,
    extensionId,
  }) => {
    let description = "test description 123";
    const requestPromise = sender.waitForRequest((request) => {
      const postData = request.postData();
      return Boolean(postData && postData.includes(description));
    });
    await page.goto(`chrome-extension://${extensionId}/browserAction.html`);
    await page.waitForLoadState("load");
    await page.fill("#issueDescription", description);
    await page.click("#submitIssue");

    const request = await requestPromise;
    const body = await request.postDataJSON();
    const log: Logging.JSONObject = body.find(
      (log: Logging.JSONObject) => log.type === "issue",
    );
    console.log(log);
    expect(log).toEqual(
      expect.objectContaining({
        logType: "custom",
        type: "issue",
        details: {
          issueType: "Bug",
          issueDescription: description,
        },
      }),
    );
  });
});
