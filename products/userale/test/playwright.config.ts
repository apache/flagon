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

import { defineConfig } from "@playwright/test";

process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = '1';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "spec",

  fullyParallel: false,
  workers: 1,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "package-chromium",
      testIgnore: ["*extension*", "*websocket*"],
      use: {
        browserName: "chromium",
        baseURL: "http://127.0.0.1:8000/",
      },
    },
    {
      name: "package-firefox",
      testIgnore: ["*extension*", "*websocket*"],
      use: {
        browserName: "firefox",
        baseURL: "http://127.0.0.1:8000/",
      },
    },
    {
      name: "extension-chromium",
      testIgnore: ["*package*", "*websocket*"],
      use: {
        browserName: "chromium",
        baseURL: "http://127.0.0.1:8000/no-logging/",
      },
    },
    {
      name: "websocket",
      testMatch: "*websocket*",
      use: {
        browserName: "chromium",
        baseURL: "http://127.0.0.1:8000/ws",
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer:
    {
      command: "pnpm run example:run",
      url: "http://127.0.0.1:8000",
      reuseExistingServer: false,
      gracefulShutdown: { signal: 'SIGTERM', timeout: 1000 }
    }
});
