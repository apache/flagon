/**
 * @jest-environment jsdom
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

import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { JSDOM } from "jsdom";
import { Configuration } from "@/configure";
import { buildHeaders, HttpJsonExporter, WebSocketExporter } from "@/exporters";
import {
  registerAuthCallback,
  resetAuthCallback,
  updateAuthHeader,
} from "@/utils/auth";
import {
  registerHeadersCallback,
  resetHeadersCallback,
  updateCustomHeaders,
} from "@/utils/headers";

describe("UserALE lifecycle, storage opt-out, manual entrypoint, and exporters", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
    resetAuthCallback();
    resetHeadersCallback();
  });

  it("manual entrypoint has zero side effects and zero storage access with persistSession: false", async () => {
    const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
      url: "https://example.test/app",
    });

    const origWindow = global.window;
    const origDocument = global.document;
    const origSelf = global.self;

    const storageSpy = jest.fn(() => {
      throw new Error("sessionStorage must not be accessed");
    });
    Object.defineProperty(dom.window, "sessionStorage", {
      get: storageSpy,
      configurable: true,
    });

    const docAddSpy = jest.spyOn(dom.window.document, "addEventListener");
    const winAddSpy = jest.spyOn(dom.window, "addEventListener");

    (global as any).window = dom.window;
    (global as any).document = dom.window.document;
    (global as any).self = dom.window;

    jest.useFakeTimers();

    try {
      await jest.isolateModulesAsync(async () => {
        const setTimeoutSpy = jest.spyOn(global, "setTimeout");
        const setIntervalSpy = jest.spyOn(global, "setInterval");

        // Importing manual must touch zero storage, listeners, timers, or window.userale
        const manual = await import("@/manual");
        expect(storageSpy).not.toHaveBeenCalled();
        expect(docAddSpy).not.toHaveBeenCalled();
        expect(winAddSpy).not.toHaveBeenCalled();
        expect(setTimeoutSpy).not.toHaveBeenCalled();
        expect(setIntervalSpy).not.toHaveBeenCalled();
        expect((dom.window as any).userale).toBeUndefined();
        expect(manual.started).toBe(false);

        const exportedBatches: any[][] = [];
        manual.registerExporter({
          async export(logs) {
            exportedBatches.push(logs);
            return { success: true };
          },
          async flush() {},
          async shutdown() {},
        });
        expect(storageSpy).not.toHaveBeenCalled();

        try {
          manual.options({
            persistSession: false,
            url: "https://collector.example.test/",
          });
          expect(storageSpy).not.toHaveBeenCalled();

          manual.start();
          expect(manual.started).toBe(true);
          expect(storageSpy).not.toHaveBeenCalled();

          expect(manual.log({ type: "custom-event" })).toBe(true);
          await manual.flush();
          expect(exportedBatches.length).toBe(1);
          expect(exportedBatches[0][0].type).toBe("custom-event");
          expect(storageSpy).not.toHaveBeenCalled();
        } finally {
          manual.stop();
        }
        expect(manual.started).toBe(false);
        expect(storageSpy).not.toHaveBeenCalled();
      });
    } finally {
      (global as any).window = origWindow;
      (global as any).document = origDocument;
      (global as any).self = origSelf;
      dom.window.close();
    }
  });

  it("respects <script data-persist-session='false'> without accessing sessionStorage", async () => {
    const bundlePath = path.resolve(__dirname, "../../build/main.global.js");
    const bundleSource = fs.readFileSync(bundlePath, "utf8");
    const storageSpy = jest.fn(() => {
      throw new Error("sessionStorage blocked");
    });

    const html = `<!DOCTYPE html><html><head></head><body></body></html>`;
    const dom = new JSDOM(html, {
      url: "https://example.test/page",
      runScripts: "dangerously",
      beforeParse(win) {
        Object.defineProperty(win, "sessionStorage", {
          get: storageSpy,
          configurable: true,
        });
      },
    });

    try {
      const script = dom.window.document.createElement("script");
      script.setAttribute("data-persist-session", "false");
      script.setAttribute("data-autostart", "false");
      script.textContent = bundleSource;
      dom.window.document.head.appendChild(script);

      expect(storageSpy).not.toHaveBeenCalled();
      expect((dom.window as any).userale).toBeDefined();
      expect((dom.window as any).userale.options().persistSession).toBe(false);
    } finally {
      dom.window.close();
    }
  });

  it("halts setup() polling when options({ autostart: false }) is called", async () => {
    jest.useFakeTimers();

    await jest.isolateModulesAsync(async () => {
      const main = await import("@/main");
      expect(main.started).toBe(false);

      main.options({ autostart: false });
      jest.advanceTimersByTime(1000);

      expect(main.started).toBe(false);
    });
  });

  it("stops interval logging, detaches listeners, avoids duplicates across cycles, shuts down exporter, and toggles logDetails dynamically", async () => {
    jest.useFakeTimers();

    await jest.isolateModulesAsync(async () => {
      const manual = await import("@/manual");
      const exportedBatches: any[][] = [];
      const shutdownSpy = jest.fn(async () => {});
      const flushSpy = jest.fn(async () => {});

      manual.registerExporter({
        async export(logs) {
          exportedBatches.push([...logs]);
          return { success: true };
        },
        flush: flushSpy,
        shutdown: shutdownSpy,
      });

      manual.options({
        persistSession: false,
        logDetails: false,
        logCountThreshold: 100,
        transmitInterval: 5000,
      });

      const btn = document.createElement("button");
      btn.id = "cycle-btn";
      document.body.appendChild(btn);

      const input = document.createElement("input");
      input.id = "cycle-input";
      input.value = "first-secret";
      document.body.appendChild(input);

      // Cycle 1
      try {
        manual.start();
        btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await manual.flush();

        expect(exportedBatches.length).toBe(1);
        const cycle1ClickCount = exportedBatches[0].filter(
          (l) => l.type === "click" && l.logType === "raw",
        ).length;
        const cycle1InputLog = exportedBatches[0].find(
          (l) => l.type === "input" && l.logType === "raw",
        );
        expect(cycle1ClickCount).toBe(1);
        expect(cycle1InputLog.details).toBeNull();

        // Toggle logDetails dynamically while running
        manual.options({ logDetails: true });
        input.value = "second-value";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await manual.flush();
        expect(exportedBatches.length).toBe(2);
        expect(exportedBatches[1][0].details).toEqual({
          value: "second-value",
        });

        // Stop must halt handlers, interval logging, and shut down exporter
        manual.stop();
        expect(shutdownSpy).toHaveBeenCalledTimes(1);

        btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        const pkg = await import("@/packageLogs");
        expect(
          pkg.packageIntervalLog(new MouseEvent("click", { bubbles: true })),
        ).toBe(false);
        await manual.flush();
        expect(exportedBatches.length).toBe(2);

        // Cycle 2: restarting must not double-attach listeners
        manual.options({ logDetails: false });
        manual.start();
        btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await manual.flush();

        expect(exportedBatches.length).toBe(3);
        expect(
          exportedBatches[2].filter(
            (l) => l.type === "click" && l.logType === "raw",
          ).length,
        ).toBe(1);
      } finally {
        manual.stop();
        btn.remove();
        input.remove();
      }
    });
  });

  it("resets packageIntervalLog state even when a callback filters out the transitioned interval log", async () => {
    await jest.isolateModulesAsync(async () => {
      const manual = await import("@/manual");
      const exported: any[] = [];
      manual.registerExporter({
        async export(logs) {
          exported.push(...logs);
          return { success: true };
        },
        async flush() {},
        async shutdown() {},
      });

      const btnA = document.createElement("button");
      btnA.id = "btn-a";
      const btnB = document.createElement("button");
      btnB.id = "btn-b";
      const btnC = document.createElement("button");
      btnC.id = "btn-c";
      document.body.append(btnA, btnB, btnC);

      try {
        manual.options({ persistSession: false });
        manual.start();

        // Drop all interval logs on button A, keep interval logs on button B
        manual.addCallbacks({
          dropBtnA: (log: any) => {
            if (log.logType === "interval" && log.target === "button#btn-a") {
              return null;
            }
            return log;
          },
        });

        const pkg = await import("@/packageLogs");

        // Accumulate 3 events on btnA
        for (let i = 0; i < 3; i++) {
          const ev = new MouseEvent("mouseover", { bubbles: true });
          Object.defineProperty(ev, "target", { value: btnA });
          Object.defineProperty(ev, "timeStamp", { value: 1000 + i * 10 });
          pkg.packageIntervalLog(ev);
        }

        // Transition to btnB: btnA interval log is filtered out, state must reset to btnB (count = 1)
        const evB1 = new MouseEvent("mouseover", { bubbles: true });
        Object.defineProperty(evB1, "target", { value: btnB });
        Object.defineProperty(evB1, "timeStamp", { value: 2000 });
        expect(pkg.packageIntervalLog(evB1)).toBe(false);

        // Transition to btnC: btnB interval log must emit with count = 1, not leaked count from btnA
        const evC1 = new MouseEvent("mouseover", { bubbles: true });
        Object.defineProperty(evC1, "target", { value: btnC });
        Object.defineProperty(evC1, "timeStamp", { value: 2500 });
        expect(pkg.packageIntervalLog(evC1)).toBe(true);

        await manual.flush();
        const intervalLogs = exported.filter((l) => l.logType === "interval");
        expect(intervalLogs).toHaveLength(1);
        expect(intervalLogs[0].target).toBe("button#btn-b");
        expect(intervalLogs[0].count).toBe(1);
        expect(intervalLogs[0].duration).toBe(500);
      } finally {
        manual.stop();
        btnA.remove();
        btnB.remove();
        btnC.remove();
      }
    });
  });

  it("enforces maxQueueSize, clears queue on reset(), and awaits flush()", async () => {
    await jest.isolateModulesAsync(async () => {
      const manual = await import("@/manual");
      const exportedBatches: any[][] = [];
      let resolveExport!: () => void;

      manual.registerExporter({
        export(logs) {
          exportedBatches.push([...logs]);
          return new Promise((resolve) => {
            resolveExport = () => resolve({ success: true });
          });
        },
        async flush() {},
        async shutdown() {},
      });

      manual.options({ persistSession: false, maxQueueSize: 3 });
      try {
        manual.start();

        for (let i = 1; i <= 5; i++) {
          manual.log({ type: `ev-${i}` });
        }

        // Queue was capped at newest 3 logs before reset()
        const flushPromise = manual.flush();
        expect(exportedBatches).toHaveLength(1);
        expect(exportedBatches[0].map((l) => l.type)).toEqual([
          "ev-3",
          "ev-4",
          "ev-5",
        ]);

        let settled = false;
        void flushPromise.then(() => {
          settled = true;
        });
        await Promise.resolve();
        expect(settled).toBe(false);

        resolveExport();
        await flushPromise;
        expect(settled).toBe(true);

        manual.log({ type: "before-reset" });
        manual.reset();
        await manual.flush();
        expect(exportedBatches).toHaveLength(1);
      } finally {
        manual.stop();
      }
    });
  });

  it("does not assign window.userale from ESM build/main.mjs (unlike IIFE build/main.global.js)", () => {
    const esmPath = path.resolve(__dirname, "../../build/main.mjs");
    const probeScript = `
      globalThis.window = {};
      const mod = await import(${JSON.stringify("file://" + esmPath)});
      console.log(JSON.stringify({
        hasWindowUserale: "userale" in globalThis.window,
        hasStart: typeof mod.start === "function",
        hasManualExports: typeof mod.reset === "function" && typeof mod.flush === "function"
      }));
    `;
    const stdout = execFileSync(
      process.execPath,
      ["--input-type=module", "-e", probeScript],
      { encoding: "utf8" },
    );
    const parsed = JSON.parse(stdout.trim());
    expect(parsed).toEqual({
      hasWindowUserale: false,
      hasStart: true,
      hasManualExports: true,
    });
  });

  it("returns cloned snapshots from options()", async () => {
    await jest.isolateModulesAsync(async () => {
      const manual = await import("@/manual");
      manual.options({
        persistSession: false,
        headers: { "X-Initial": "ok" },
      });

      const snap = manual.options();
      snap.headers!["X-Initial"] = "mutated";
      snap.toolName = "mutated-tool";

      const snap2 = manual.options();
      expect(snap2.headers).toEqual({ "X-Initial": "ok" });
      expect(snap2.toolName).toBeNull();
    });
  });

  it("buildHeaders avoids mutating config and throwing callbacks clear stale credentials", () => {
    const consoleErr = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const config = Configuration.createUninitialized();
    config.update({
      authHeader: "Bearer initial-static",
      headers: { "X-Custom": "initial-header" },
    });

    let shouldThrow = false;
    expect(
      registerAuthCallback(() => {
        if (shouldThrow) {
          throw new Error("auth boom");
        }
        return "Bearer dynamic-token";
      }),
    ).toBe(true);
    expect(
      registerHeadersCallback(() => {
        if (shouldThrow) {
          throw new Error("headers boom");
        }
        return { "X-Custom": "dynamic-header" };
      }),
    ).toBe(true);

    const built = buildHeaders(config);
    expect(built.get("Authorization")).toBe("Bearer dynamic-token");
    expect(built.get("X-Custom")).toBe("dynamic-header");
    // Dynamic resolution must not overwrite config
    expect(config.authHeader).toBe("Bearer initial-static");
    expect(config.headers).toEqual({ "X-Custom": "initial-header" });

    // Throwing callback must clear previously cached credentials on update helpers
    shouldThrow = true;
    updateAuthHeader(config);
    updateCustomHeaders(config);
    expect(config.authHeader).toBeNull();
    expect(config.headers).toBeNull();
    expect(consoleErr).toHaveBeenCalled();
  });

  it("HttpJsonExporter returns { success: false } on HTTP 500 response", async () => {
    const consoleErr = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const origFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    }) as any;

    try {
      const config = Configuration.createUninitialized();
      config.update({ url: "https://collector.example.test/logs" });
      const exporter = new HttpJsonExporter(config);
      const res = await exporter.export([{ type: "click" } as any]);
      expect(res.success).toBe(false);
      expect(res.error).toBeInstanceOf(Error);
      expect(res.error?.message).toContain("Internal Server Error");
      expect(consoleErr).toHaveBeenCalled();
    } finally {
      global.fetch = origFetch;
    }
  });

  it("WebSocketExporter buffers during CONNECTING, fails when CLOSED, and closes on shutdown()", async () => {
    const origWebSocket = global.WebSocket;
    const listeners: Record<string, Array<() => void>> = {};
    const mockWsInstance: any = {
      readyState: 0, // CONNECTING
      send: jest.fn(),
      close: jest.fn(),
      addEventListener: jest.fn((ev: string, fn: () => void) => {
        listeners[ev] = listeners[ev] || [];
        listeners[ev].push(fn);
      }),
    };
    const MockWS: any = jest.fn(() => mockWsInstance);
    MockWS.CONNECTING = 0;
    MockWS.OPEN = 1;
    MockWS.CLOSING = 2;
    MockWS.CLOSED = 3;
    global.WebSocket = MockWS;

    try {
      const config = Configuration.createUninitialized();
      config.update({ url: "wss://collector.example.test/ws" });
      const exporter = new WebSocketExporter(config);

      // Buffered while CONNECTING
      const queuedResult = await exporter.export([{ type: "click" } as any]);
      expect(queuedResult.success).toBe(true);
      expect(mockWsInstance.send).not.toHaveBeenCalled();

      // Drained when OPEN
      mockWsInstance.readyState = 1;
      for (const fn of listeners.open || []) {
        fn();
      }
      expect(mockWsInstance.send).toHaveBeenCalledTimes(1);

      // Returns failure when CLOSED
      mockWsInstance.readyState = 3;
      const closedResult = await exporter.export([{ type: "blur" } as any]);
      expect(closedResult.success).toBe(false);
      expect(closedResult.error?.message).toBe("WebSocket is not open");

      // shutdown closes socket when OPEN
      mockWsInstance.readyState = 1;
      await exporter.shutdown();
      expect(mockWsInstance.close).toHaveBeenCalledTimes(1);
    } finally {
      global.WebSocket = origWebSocket;
    }
  });
});
