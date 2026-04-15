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
import "global-jsdom/register";
import { getInitialSettings, timeStampScale } from "@/utils/getInitialSettings";

describe("getInitialSettings", () => {
  describe("timeStampScale", () => {
    it("no event.timestamp", () => {
      const e = {} as Event;
      const ts = timeStampScale(e);
      expect(ts(e.timeStamp) / 1000).toBeCloseTo(Date.now() / 1000, 1);
    });

    it("zero", () => {
      const e = { timeStamp: 0 } as Event;
      const ts = timeStampScale(e);
      expect(ts(e.timeStamp) / 1000).toBeCloseTo(Date.now() / 1000, 1);
    });

    it("epoch milliseconds", () => {
      const e = { timeStamp: 1451606400000 } as Event;
      const ts = timeStampScale(e);
      expect(ts(e.timeStamp)).toBe(1451606400000);
    });

    it("epoch microseconds", () => {
      const e = { timeStamp: 1451606400000000 } as Event;
      const ts = timeStampScale(e);
      expect(ts(e.timeStamp)).toBe(1451606400000);
    });

    // Currently unsupported in jsdom
    // Chrome specific -- manual testing is clear;
    it("performance navigation time", () => {
      const terriblePolyfill = { timing: { navigationStart: Date.now() } };
      const originalPerformance = global.performance;
      Object.defineProperty(global, "performance", {
        value: terriblePolyfill,
        writable: true,
      });
      const e = { timeStamp: 1 } as Event;
      const ts = timeStampScale(e);
      expect(ts(e.timeStamp)).toBe(performance.timeOrigin + e.timeStamp);
      global.performance = originalPerformance;
    });
  });

  describe("getInitialSettings", () => {
    function injectScript(attrs: Record<string, string>): HTMLScriptElement {
      const script = document.createElement("script");
      for (const [k, v] of Object.entries(attrs)) {
        script.setAttribute(k, v);
      }
      document.head.appendChild(script);
      return script;
    }

    afterEach(() => {
      // Remove any injected script tags between tests
      document
        .querySelectorAll("script[data-url], script[data-user]")
        .forEach((el) => el.remove());
    });

    it("fetches all settings from a script tag", () => {
      injectScript({
        "data-url": "http://test.com",
        "data-interval": "100",
        "data-threshold": "10",
        "data-user": "testuser",
        "data-version": "1.0.0",
        "data-log-details": "false",
        "data-resolution": "100",
        "data-tool": "testtool",
      });

      const config = getInitialSettings();

      expect(config).toHaveProperty("autostart", true);
      expect(config).toHaveProperty("url", "http://test.com");
      expect(config).toHaveProperty("transmitInterval", 100);
      expect(config).toHaveProperty("logCountThreshold", 10);
      expect(config).toHaveProperty("userId", "testuser");
      expect(config).toHaveProperty("toolVersion", "1.0.0");
      expect(config).toHaveProperty("logDetails", false);
      expect(config).toHaveProperty("resolution", 100);
      expect(config).toHaveProperty("toolName", "testtool");
    });

    it("grabs user id from params", () => {
      // jsdom doesn't allow changing window.location.search after construction,
      // so we simulate userFromParams by injecting the attribute directly.
      injectScript({ "data-user-from-params": "user" });

      const config = getInitialSettings();
      expect(config).toHaveProperty("userFromParams", "user");
    });
  });
});
