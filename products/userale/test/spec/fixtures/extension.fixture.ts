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

import { test as base, chromium, type BrowserContext, type Page, type Request } from '@playwright/test';
import path from 'path';
import os from 'os';

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
  waitForPostRequest: (
    filterFn?: (req: Request) => boolean
  ) => Promise<Request>;
}>({
  context: async ({ }, use) => {
    const pathToExtension = path.join(
      __dirname,
      "../../../packages/flagon-userale-ext/build/chrome-mv3-prod/"
    );
    const context = await chromium.launchPersistentContext(os.tmpdir(), {
      channel: 'chromium',
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },

  extensionId: async ({ context }, use) => {
    let [background] = context.serviceWorkers();
    if (!background)
      background = await context.waitForEvent('serviceworker');

    const extensionId = background.url().split('/')[2];
    await use(extensionId);
  },

  waitForPostRequest: async ({ context }, use) => {
    const waitForPostRequest = (filterFn?: (req: Request) => boolean) => {
      return new Promise<Request>((resolve) => {
        const listener = async (req: Request) => {
          const url = req.url();
          const method = req.method();

          if (!url.startsWith('http://localhost:8000') || method !== 'POST') return;

          if (!filterFn || filterFn(req)) {
            context.off('request', listener); // cleanup
            resolve(req);
          }
        };

        context.on('request', listener);
      });
    };

    await use(waitForPostRequest);
  },
});

export const expect = test.expect;
