/**
 * @jest-environment node
 */
/*!
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

describe("UserALE Node SSR safety", () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("imports src/main.ts and src/manual.ts in pure Node SSR without throwing ReferenceError: self is not defined", async () => {
    expect(typeof window).toBe("undefined");
    expect(typeof document).toBe("undefined");
    expect(typeof self).toBe("undefined");

    jest.useFakeTimers();

    await jest.isolateModulesAsync(async () => {
      const main = await import("@/main");
      const manual = await import("@/manual");

      jest.advanceTimersByTime(1000);

      expect(typeof main.start).toBe("function");
      expect(typeof main.stop).toBe("function");
      expect(main.started).toBe(false);

      expect(typeof manual.start).toBe("function");
      expect(typeof manual.stop).toBe("function");
      expect(manual.started).toBe(false);
    });
  });
});
