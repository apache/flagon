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
 * Tests specific to the IIFE / script-tag distribution of UserALE.
 * Covers window.userale API behaviour and callback pipeline.
 * Core OTLP wire-format validity is covered here as the canonical check;
 * the ESM spec only re-checks what differs in that distribution.
 */
test.describe("IIFE distribution", () => {
  test("sends a page load log", async ({ page, waitForPostRequest }) => {
    const requestPromise = waitForPostRequest();

    await page.goto("./");
    for (let i = 0; i < 6; i++) {
      await page.getByText("Click Me!", { exact: true }).click();
    }

    const req = await requestPromise;
    const body = req.postDataJSON();
    const records = extractLogRecords(body);

    const loadRecord = records.find((r) => r.eventName === "load");

    expect(loadRecord).toBeDefined();
    expect(attrValue(loadRecord!, "userale.logType")).toBe("custom");
    expect(attrValue(loadRecord!, "userale.type")).toBe("load");

    const details = attrValue(loadRecord!, "userale.details") as any;
    expect(
      details?.values?.find((kv: OTLP.KeyValue) => kv.key === "pageLoadTime")?.value?.intValue
    ).toBeDefined();
  });

  test("builds the correct path in a log", async ({ page, waitForPostRequest }) => {
    const requestPromise = waitForPostRequest();

    await page.goto("./");
    for (let i = 0; i < 6; i++) {
      await page.getByText("Click Me!", { exact: true }).click();
    }

    const req = await requestPromise;
    const body = req.postDataJSON();
    const records = extractLogRecords(body);

    const buttonClickRecord = records.find(
      (r) => attrValue(r, "userale.target") === "button#test_button"
    );
    expect(buttonClickRecord).toBeDefined();

    const pathAttr = attrValue(buttonClickRecord!, "userale.path") as any;
    const actualPath = pathAttr?.values?.map((v: any) => v.stringValue);
    expect(actualPath).toEqual([
      "button#test_button",
      "div.container",
      "body",
      "html",
      "#document",
      "Window",
    ]);
  });

  test("produces valid OTLP log records", async ({ page, waitForPostRequest }) => {
    const requestPromise = waitForPostRequest();

    await page.goto("./");
    for (let i = 0; i < 6; i++) {
      await page.getByText("Click Me!", { exact: true }).click();
    }

    const req = await requestPromise;
    const body = req.postDataJSON() as Record<string, unknown>;

    expect(body).toHaveProperty("resourceLogs");
    const resourceLogs = (body as any).resourceLogs;
    expect(Array.isArray(resourceLogs)).toBe(true);
    expect(resourceLogs.length).toBeGreaterThan(0);
    expect(resourceLogs[0].resource).toHaveProperty("attributes");

    const scopeLogs = resourceLogs[0].scopeLogs;
    expect(Array.isArray(scopeLogs)).toBe(true);
    expect(scopeLogs[0].scope).toHaveProperty("name", "flagon-userale");

    const records: OTLP.LogRecord[] = scopeLogs[0].logRecords;
    expect(Array.isArray(records)).toBe(true);
    expect(records.length).toBeGreaterThan(0);

    for (const record of records) {
      expect(typeof record.timeUnixNano).toBe("string");
      expect(typeof record.observedTimeUnixNano).toBe("string");
      expect(typeof record.severityNumber).toBe("number");
      expect(typeof record.eventName).toBe("string");
      expect(record.body).toHaveProperty("stringValue");
      expect(Array.isArray(record.attributes)).toBe(true);
      expect(typeof record.traceId).toBe("string");
      expect(record.traceId).toHaveLength(32);
      expect(typeof record.spanId).toBe("string");
      expect(record.spanId).toHaveLength(16);
      expect(attrValue(record, "userale.logType")).toBeDefined();
      expect(attrValue(record, "browser.url")).toBeDefined();
      expect(attrValue(record, "userale.sessionId")).toBeDefined();
    }
  });

});
