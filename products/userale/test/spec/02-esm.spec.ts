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

import { test, expect } from "./fixtures/page.fixture";
import type { OTLP } from "flagon-userale";

function extractLogRecords(body: OTLP.ExportLogsServiceRequest): OTLP.LogRecord[] {
  return body.resourceLogs[0].scopeLogs[0].logRecords;
}

function attrValue(record: OTLP.LogRecord, key: string): unknown {
  const kv = record.attributes.find((a) => a.key === key);
  if (!kv) return undefined;
  const v = kv.value as any;
  return v.stringValue ?? v.boolValue ?? v.intValue ?? v.doubleValue ?? v.arrayValue ?? v.kvlistValue;
}

/**
 * Tests specific to the ESM distribution of UserALE.
 * UserALE is instantiated programmatically (no script-tag data-* attributes).
 * We verify the same core behaviours work when loaded as an ES module,
 * without re-testing every OTLP field detail already covered in 01-iife.spec.ts.
 */
test.describe("ESM distribution", () => {
  test("sends logs", async ({ page, waitForPostRequest }) => {
    const requestPromise = waitForPostRequest();

    await page.goto("/esm");
    for (let i = 0; i < 6; i++) {
      await page.getByText("Click Me!", { exact: true }).click();
    }

    const req = await requestPromise;
    const body = req.postDataJSON();
    const records = extractLogRecords(body);

    expect(records.length).toBeGreaterThan(0);
  });

  test("sends a page load log", async ({ page, waitForPostRequest }) => {
    const requestPromise = waitForPostRequest();

    await page.goto("/esm");
    for (let i = 0; i < 6; i++) {
      await page.getByText("Click Me!", { exact: true }).click();
    }

    const req = await requestPromise;
    const body = req.postDataJSON();
    const records = extractLogRecords(body);

    const loadRecord = records.find((r) => r.eventName === "load");
    expect(loadRecord).toBeDefined();
    expect(attrValue(loadRecord!, "userale.type")).toBe("load");

    const details = attrValue(loadRecord!, "userale.details") as any;
    expect(
      details?.values?.find((kv: OTLP.KeyValue) => kv.key === "pageLoadTime")?.value?.intValue
    ).toBeDefined();
  });

  test("stop suppresses logs, start resumes them", async ({ page, context }) => {
    await page.goto("/esm");
    await page.evaluate(() => (window as any)._userale.stop());

    // Set up the race before clicking so no request can slip through undetected
    const silencePromise = Promise.race([
      new Promise<"request">((resolve) => {
        context.once("request", (req) => {
          if (req.url().includes("/v1/logs") && req.method() === "POST") resolve("request");
        });
      }),
      new Promise<"silence">((resolve) => setTimeout(() => resolve("silence"), 2000)),
    ]);
    for (let i = 0; i < 5; i++) await page.getByText("Click Me!", { exact: true }).click();
    expect(await silencePromise).toBe("silence");

    // Re-start — clicks should now produce a POST within the transmit interval
    const resumePromise = new Promise<"request">((resolve) => {
      context.on("request", (req) => {
        if (req.url().includes("/v1/logs") && req.method() === "POST") resolve("request");
      });
    });
    await page.evaluate(() => (window as any)._userale.start());
    for (let i = 0; i < 5; i++) await page.getByText("Click Me!", { exact: true }).click();
    await page.waitForTimeout(1200);

    expect(await resumePromise).toBe("request");
  });

  test("executes added callbacks", async ({ page, waitForPostRequest }) => {
    const postPromise = waitForPostRequest();

    await page.goto("/esm");
    for (let i = 0; i < 10; i++) {
      await page.getByText("Click Me!", { exact: true }).click();
    }

    const req = await postPromise;
    const records = extractLogRecords(req.postDataJSON());

    const buttonClickRecord = records.find(
      (r) =>
        attrValue(r, "userale.target") === "button#test_button" &&
        attrValue(r, "customLabel") === "map & packageLog Example"
    );

    expect(buttonClickRecord).toBeDefined();
    expect(attrValue(buttonClickRecord!, "customLabel")).toBe("map & packageLog Example");
  });
});
