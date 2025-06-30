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
import { validate } from "jsonschema";
import { test, expect } from "./fixtures/extension.fixture";

test.describe("Userale logging", () => {
  test("sends a page load log", async ({ page, waitForPostRequest }) => {
    const requestPromise = waitForPostRequest();
  
    await page.goto("./");
    for (let i = 0; i < 6; i++) {
      await page.getByText("Click Me!", { exact: true }).click();
    }
  
    const req = await requestPromise;
    const body = req.postDataJSON();
  
    const pageLoadLog = body.find(
      (log: any) => log.type === "load"
    );
  
    expect(pageLoadLog).toEqual(
      expect.objectContaining({
        logType: "custom",
        type: "load",
      })
    );
  
    expect(pageLoadLog.details.pageLoadTime).toBeGreaterThan(0);
  });
  

  test("builds the correct path in a log", async ({ page, waitForPostRequest }) => {
    const requestPromise = waitForPostRequest();

    await page.goto("./");
    for (let i = 0; i < 6; i++) {
      await page.getByText("Click Me!", { exact: true }).click();
    }

    const req = await requestPromise;
    const body = req.postDataJSON();

    const buttonClickLog = body.find(
      (log: any) => log.target === "button#test_button"
    );

    const actualPath = buttonClickLog.path;
    const expectedPath = [
      "button#test_button",
      "div.container",
      "body",
      "html",
      "#document",
      "Window",
    ];

    expect(actualPath).toEqual(expectedPath);
  });

  test("produces valid logs", async ({ page, waitForPostRequest }) => {
    const requestPromise = waitForPostRequest();

    await page.goto("./");
    for (let i = 0; i < 6; i++) {
      await page.getByText("Click Me!", { exact: true }).click();
    }

    const req = await requestPromise;
    const body = req.postDataJSON();

    const schema = require("../../example/log.schema.json");

    for (const log of body) {
      if (log.logType === "raw" || log.logType === "custom") {
        const result = validate(log, schema);
        if(!result.valid) {
          console.error(`Schema validation failed for log:`, log);
          console.error(`Errors:`, result.errors);
        }
        expect(result.valid).toBe(true);
      }
    }
  });
});
