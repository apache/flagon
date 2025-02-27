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

import {
  Page,
  test as base,
  chromium,
  type BrowserContext,
} from "@playwright/test";
import path from "path";

export const test = base.extend<{
  context: BrowserContext;
  sender: Page;
  extensionId: string;
}>({
  context: async ({ baseURL, context }, use) => {
    if (baseURL?.includes("no-logging")) {
      const extPath = path.join(
        __dirname,
        "../../../../build/UserALEWebExtension/",
      );
      const dataPath = path.join(__dirname, "../../chromeData/");
      const extContext = await chromium.launchPersistentContext(dataPath, {
        headless: false,
        args: [
          `--disable-extensions-except=${extPath}`,
          `--load-extension=${extPath}`,
        ],
      });
      await use(extContext);
      await extContext.close();
    } else {
      await use(context);
      await context.close();
    }
  },
  sender: async ({ context, baseURL, page }, use) => {
    let sender: Page = page;
    if (baseURL?.includes("no-logging")) {
      // for manifest v2:
      [sender] = context.backgroundPages();
      if (baseURL?.includes("no-logging") && !sender)
        sender = await context.waitForEvent("backgroundpage");
    }

    await use(sender);
  },
  extensionId: async ({ baseURL, sender }, use) => {
    let extensionId = "";
    if (baseURL?.includes("no-logging")) {
      extensionId = sender.url().split("/")[2];
    }
    use(extensionId);
  },
});

export const expect = test.expect;
