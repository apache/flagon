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

import { expect, test } from "@playwright/test";

test.describe("Website interactive UserALE 2.5 demo (site/_includes/useralejsDemo.html)", () => {
  test("captures interactions, switches wire formats (UserALE/OTLP/Protobuf), triggers rage-click & DOM mutation, and scrubs PII", async ({
    page,
  }) => {
    await page.goto("./site-demo");

    // 1. Verify UserALE 2.5 global and wire-format helpers are exposed
    const hasHelpers = await page.evaluate(() => {
      const u = (window as any).userale;
      return Boolean(
        u &&
        typeof u.toOtlpExportLogsServiceRequest === "function" &&
        typeof u.toProtoLogBatch === "function",
      );
    });
    expect(hasHelpers).toBe(true);

    // 2. Click a standard interaction button and verify a log card renders
    await page.locator("#demo-blue-button").click();
    await expect(page.locator("#log-feed")).toContainText(
      "div#demo-blue-button",
    );

    // 3. Switch wire format to OpenTelemetry OTLP/JSON and verify live re-serialization
    await page
      .locator('#wire-format-selector button[data-format="otlp"]')
      .click();
    await expect(page.locator("#log-feed")).toContainText('"resourceLogs"');
    await expect(page.locator("#log-feed")).toContainText('"flagon.target"');

    // 4. Switch wire format to Protobuf v1 Canonical JSON and verify live re-serialization
    await page
      .locator('#wire-format-selector button[data-format="proto-json"]')
      .click();
    await expect(page.locator("#log-feed")).toContainText('"LOG_TYPE_');
    await expect(page.locator("#log-feed")).toContainText('"metadata"');

    // Switch back to UserALE Flat JSON
    await page
      .locator('#wire-format-selector button[data-format="http-json"]')
      .click();

    // 5. Trigger RageClickDetector (3 rapid clicks) and verify rage_click custom log
    const rageBtn = page.locator("#rage-click-button");
    await rageBtn.click({ delay: 10 });
    await rageBtn.click({ delay: 10 });
    await rageBtn.click({ delay: 10 });
    await expect(page.locator("#log-feed")).toContainText("rage_click");

    // 6. Trigger MutationCollector (+ Node) and verify mutation log
    await page.locator("#mutate-dom-button").click();
    await expect(page.locator("#log-feed")).toContainText("mutation");

    // 7. Type into data-userale-redact="true" input and verify PII is scrubbed
    const secret = "my-ultra-secret-token-999";
    await page.locator("#demo-redact-input").fill(secret);
    await page.locator("#demo-redact-input").dispatchEvent("change");
    await expect(page.locator("#log-feed")).toContainText(
      '"value": "[REDACTED]"',
    );
    await expect(page.locator("#log-feed")).not.toContainText(secret);
  });
});
