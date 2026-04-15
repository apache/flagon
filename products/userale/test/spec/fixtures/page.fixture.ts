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

import { test as base, type BrowserContext, type Request } from '@playwright/test';

/**
 * Fixture for iife/esm tests that run in a plain browser (no extension).
 * Uses the standard Playwright page/context so browserName from the project
 * config is respected (chromium, firefox, etc.).
 */
export const test = base.extend<{
  waitForPostRequest: (
    filterFn?: (req: Request) => boolean
  ) => Promise<Request>;
}>({
  waitForPostRequest: async ({ context }: { context: BrowserContext }, use) => {
    const waitForPostRequest = (filterFn?: (req: Request) => boolean) => {
      return new Promise<Request>((resolve) => {
        const listener = (req: Request) => {
          const url = req.url();
          const method = req.method();

          const isOtlpLogs = url === 'http://localhost:4318/v1/logs' && method === 'POST';
          if (!isOtlpLogs) return;

          if (!filterFn || filterFn(req)) {
            context.off('request', listener);
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
