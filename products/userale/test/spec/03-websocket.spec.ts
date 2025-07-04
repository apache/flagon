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
import { test, expect } from "./fixtures/extension.fixture";

test.describe("Userale logging", () => {
  test("connects to WebSocket server and sends logs", async ({ page }) => {
    const wsPromise = page.waitForEvent("websocket");

    await page.goto("http://127.0.0.1:8000/ws");
    for (let i = 0; i < 6; i++) {
      await page.getByText("Click Me!", { exact: true }).click();
    }

    const ws = await wsPromise;
    expect(ws.url()).toBe("ws://localhost:8000/");

    const message = await ws.waitForEvent("framesent", {
      predicate: (event) => event.payload.includes('"logType":"custom"'),
    });

    expect(message).toEqual(
      expect.objectContaining({
        payload: expect.stringContaining('"logType":"custom"'),
      })
    );
  });
});
