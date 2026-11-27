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

import "whatwg-fetch";
import fs from "fs";
import path from "path";
import { validate } from "jsonschema";
import { Configuration } from "@/configure";
import { createUserAle } from "@/manual";
import type { Logging } from "@/types";

describe("createUserAle(), PrivacyOptions, lockPrivacy(), DOM clobbering, and Shadow DOM (#217)", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("isolates config, logs, callbacks, auth/headers, exporters, intervals, and replay across two instances", async () => {
    const exportedA: Logging.Log[][] = [];
    const exportedB: Logging.Log[][] = [];
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
    } as Response);

    const a = createUserAle({
      url: "https://collector-a.example/logs",
      persistSession: false,
      sessionId: "sess-a",
      toolName: "app-a",
      logDetails: false,
      exporter: {
        export: async (logs) => {
          exportedA.push([...logs]);
          return { success: true };
        },
        flush: async () => {},
        shutdown: async () => {},
      },
    });

    const b = createUserAle({
      url: "https://collector-b.example/logs",
      persistSession: false,
      sessionId: "sess-b",
      toolName: "app-b",
      logDetails: true,
      exporter: {
        export: async (logs) => {
          exportedB.push([...logs]);
          return { success: true };
        },
        flush: async () => {},
        shutdown: async () => {},
      },
    });

    try {
      expect(a.options().toolName).toBe("app-a");
      expect(b.options().toolName).toBe("app-b");
      expect(a.options().sessionId).toBe("sess-a");
      expect(b.options().sessionId).toBe("sess-b");

      a.addCallbacks({
        tagA: (log: Logging.Log) => ({ ...log, origin: "instance-a" }),
      });
      b.addCallbacks({
        dropClicks: (log: Logging.Log) => (log.type === "audit-b" ? log : null),
      });

      a.registerAuthCallback(() => "Bearer token-a");
      b.registerAuthCallback(() => "Bearer token-b");
      a.registerHeadersCallback(() => ({ "X-Tenant": "tenant-a" }));
      b.registerHeadersCallback(() => ({ "X-Tenant": "tenant-b" }));

      a.start();
      b.start();

      // Custom logs route through each instance's isolated callbacks and exporters
      a.packageCustomLog({ type: "audit-a" }, () => ({}), true);
      b.packageCustomLog({ type: "cleared-by-b-reset" }, () => ({}), true);
      b.packageCustomLog({ type: "should-drop-by-b" }, () => ({}), true);

      // Isolated interval tracking on a vs b (`b.reset()` does not clear `a`'s queue or interval state)
      const btnA1 = document.createElement("button");
      btnA1.id = "btn-a1";
      const btnA2 = document.createElement("button");
      btnA2.id = "btn-a2";
      document.body.append(btnA1, btnA2);

      btnA1.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      btnA1.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      b.reset();
      btnA2.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      b.packageCustomLog({ type: "audit-b" }, () => ({}), true);

      // Replay ring buffers stay isolated between a and b
      let emitA!: (ev: any) => void;
      let emitB!: (ev: any) => void;
      a.startSessionReplay({
        observeMutations: false,
        detectRageClicks: false,
        flushOnError: false,
        recorder: ({ emit }) => {
          emitA = emit;
          return () => {};
        },
      });
      b.startSessionReplay({
        observeMutations: false,
        detectRageClicks: false,
        flushOnError: false,
        recorder: ({ emit }) => {
          emitB = emit;
          return () => {};
        },
      });
      emitA({ type: 2, data: { owner: "A" }, timestamp: 1000 });
      emitB({ type: 2, data: { owner: "B" }, timestamp: 2000 });
      expect(a.getActiveReplayRingBuffer()?.size()).toBe(1);
      expect(b.getActiveReplayRingBuffer()?.size()).toBe(1);
      a.stopSessionReplay();
      expect(a.getActiveReplayRingBuffer()).toBeNull();
      expect(b.getActiveReplayRingBuffer()?.size()).toBe(1);

      await a.flush();
      await b.flush();

      expect(exportedA).toHaveLength(1);
      const aCustom = exportedA[0]!.find((l) => l.type === "audit-a");
      const aInterval = exportedA[0]!.find((l) => l.logType === "interval");
      expect(aCustom).toMatchObject({
        type: "audit-a",
        origin: "instance-a",
        sessionId: "sess-a",
      });
      expect(aInterval).toMatchObject({
        target: "button#btn-a1",
        count: 2,
        origin: "instance-a",
      });

      expect(exportedB).toHaveLength(1);
      expect(exportedB[0]).toHaveLength(1);
      expect(exportedB[0]![0]).toMatchObject({
        type: "audit-b",
        sessionId: "sess-b",
      });
      expect(exportedB[0]![0]!.origin).toBeUndefined();

      // Isolated HTTP credentials when using built-in HttpJsonExporter
      const httpA = createUserAle({
        url: "https://collector-a.example/ingest",
        persistSession: false,
      });
      const httpB = createUserAle({
        url: "https://collector-b.example/ingest",
        persistSession: false,
      });
      httpA.registerAuthCallback(() => "Bearer secret-a");
      httpA.registerHeadersCallback(() => ({ "X-Instance": "A" }));
      httpB.options({ authHeader: "Bearer static-b" });

      httpA.start();
      httpB.start();
      httpA.log({ type: "ping-a" });
      httpB.log({ type: "ping-b" });
      await httpA.flush();
      await httpB.flush();

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      const headersA = fetchSpy.mock.calls[0]![1]!.headers as Headers;
      const headersB = fetchSpy.mock.calls[1]![1]!.headers as Headers;
      expect(headersA.get("Authorization")).toBe("Bearer secret-a");
      expect(headersA.get("X-Instance")).toBe("A");
      expect(headersB.get("Authorization")).toBe("Bearer static-b");
      expect(headersB.get("X-Instance")).toBeNull();

      httpA.stop();
      httpB.stop();
    } finally {
      a.stop();
      b.stop();
    }
  });

  it("enforces privacy.preset: 'strict' with zero global reads and supports captureHost: false & ignoreUntrustedEvents", async () => {
    const exported: Logging.Log[][] = [];

    const hrefSpy = jest.fn(() => "https://phi.example.test/patients/12345");
    const titleSpy = jest.fn(() => "Confidential Chart");
    const referrerSpy = jest.fn(() => "https://referrer.example.test/secret");
    const uaSpy = jest.fn(() => "CustomSecretUA/1.0");
    const widthSpy = jest.fn(() => 1920);
    const heightSpy = jest.fn(() => 1080);
    const rectSpy = jest.fn(
      () => ({ x: 1, y: 2, width: 30, height: 40 }) as DOMRect,
    );

    const origLocation = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      get: () => ({
        get href() {
          return hrefSpy();
        },
        pathname: "/patients/12345",
      }),
    });
    const origTitleDesc = Object.getOwnPropertyDescriptor(
      Document.prototype,
      "title",
    );
    const origRefDesc = Object.getOwnPropertyDescriptor(
      Document.prototype,
      "referrer",
    );
    const origUaDesc = Object.getOwnPropertyDescriptor(
      Navigator.prototype,
      "userAgent",
    );

    Object.defineProperty(document, "title", {
      configurable: true,
      get: titleSpy,
    });
    Object.defineProperty(document, "referrer", {
      configurable: true,
      get: referrerSpy,
    });
    Object.defineProperty(window.navigator, "userAgent", {
      configurable: true,
      get: uaSpy,
    });
    const origInnerW = Object.getOwnPropertyDescriptor(window, "innerWidth");
    const origInnerH = Object.getOwnPropertyDescriptor(window, "innerHeight");
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      get: widthSpy,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      get: heightSpy,
    });

    const instance = createUserAle({
      url: "https://collector.example/logs",
      persistSession: false,
      userFromParams: "token",
      events: ["click"],
      privacy: {
        preset: "strict",
        allowlistSelector: "[data-track]",
        allowedAttributes: ["data-track"],
      },
      exporter: {
        export: async (logs) => {
          exported.push([...logs]);
          return { success: true };
        },
        flush: async () => {},
        shutdown: async () => {},
      },
    });

    try {
      instance.start();
      const btn = document.createElement("button");
      btn.setAttribute("data-track", "save");
      btn.setAttribute("data-secret-phi", "John Doe");
      btn.getBoundingClientRect = rectSpy;
      document.body.appendChild(btn);

      // Synthetic dispatch has isTrusted: false -> blocked by strict ignoreUntrustedEvents: true
      btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await instance.flush();
      expect(exported).toHaveLength(0);

      // Simulate a trusted event (ignoring untrusted flag off) to verify zero global reads
      instance.options({ privacy: { ignoreUntrustedEvents: false } });
      expect(instance.options().privacy?.preset).toBe("strict");
      expect(instance.options().privacy?.allowlistSelector).toBe(
        "[data-track]",
      );

      btn.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          clientX: 50,
          clientY: 60,
        }),
      );
      await instance.flush();

      expect(exported).toHaveLength(1);
      expect(exported[0]![0]).toMatchObject({
        target: "",
        path: [],
        pageUrl: "",
        pageTitle: "",
        pageReferrer: "",
        userAgent: "",
        browser: { browser: null, version: null },
        location: null,
        scrnRes: null,
        microTime: null,
        details: null,
        attributes: { "data-track": "save" },
        style: {},
      });
      expect(exported[0]![0]!.targetRect).toBeUndefined();

      expect(hrefSpy).not.toHaveBeenCalled();
      expect(titleSpy).not.toHaveBeenCalled();
      expect(referrerSpy).not.toHaveBeenCalled();
      expect(uaSpy).not.toHaveBeenCalled();
      expect(widthSpy).not.toHaveBeenCalled();
      expect(heightSpy).not.toHaveBeenCalled();
      expect(rectSpy).not.toHaveBeenCalled();

      // capturePageUrl: true with captureHost: false captures pathname only
      const pathOnly = createUserAle({
        url: "https://collector.example/logs",
        persistSession: false,
        events: ["click"],
        privacy: {
          capturePageUrl: true,
          captureHost: false,
        },
        exporter: {
          export: async (logs) => {
            exported.push([...logs]);
            return { success: true };
          },
          flush: async () => {},
          shutdown: async () => {},
        },
      });
      pathOnly.start();
      btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await pathOnly.flush();
      pathOnly.stop();
      expect(exported[1]![0]!.pageUrl).toBe("/patients/12345");
      expect(hrefSpy).not.toHaveBeenCalled();
    } finally {
      instance.stop();
      Object.defineProperty(window, "location", {
        configurable: true,
        value: origLocation,
      });
      if (origTitleDesc) {
        Object.defineProperty(document, "title", origTitleDesc);
      } else {
        delete (document as any).title;
      }
      if (origRefDesc) {
        Object.defineProperty(document, "referrer", origRefDesc);
      } else {
        delete (document as any).referrer;
      }
      if (origUaDesc) {
        Object.defineProperty(window.navigator, "userAgent", origUaDesc);
      } else {
        delete (window.navigator as any).userAgent;
      }
      if (origInnerW) Object.defineProperty(window, "innerWidth", origInnerW);
      if (origInnerH) Object.defineProperty(window, "innerHeight", origInnerH);
    }
  });

  it("defends Configuration against __proto__/method overwrites, ReDoS in getUserIdFromParams, and dynamically rebinds events", async () => {
    const origLocation = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: { href: "https://example.test/?(a%2B)%2B=val&user=alice#hash" },
    });

    try {
      const cfg = Configuration.create({
        autostart: false,
        persistSession: false,
        skipScriptTag: true,
      });

      const payload = JSON.parse(
        '{"__proto__":{"polluted":"yes"},"constructor":{"x":1},"update":"clobbered","toolName":"safe"}',
      );
      cfg.update(payload);
      expect(({} as any).polluted).toBeUndefined();
      expect(typeof cfg.update).toBe("function");
      expect(cfg.toolName).toBe("safe");

      expect(Configuration.getUserIdFromParams("user")).toBe("alice");
      expect(Configuration.getUserIdFromParams("(a+)+")).toBe("val");
      expect(Configuration.getUserIdFromParams("a+")).toBeNull();

      // Dynamic events rebinding via AbortController + resetIntervalState
      const captured: Logging.Log[] = [];
      const inst = createUserAle({
        url: "https://collector.example/logs",
        persistSession: false,
        events: ["click"],
        exporter: {
          export: async (logs) => {
            captured.push(...logs);
            return { success: true };
          },
          flush: async () => {},
          shutdown: async () => {},
        },
      });
      inst.start();
      const btn = document.createElement("button");
      document.body.appendChild(btn);

      btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      btn.dispatchEvent(new Event("input", { bubbles: true }));
      await inst.flush();
      expect(captured.map((l) => l.type)).toEqual(["click"]);

      inst.options({ events: ["input"] });
      btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      btn.dispatchEvent(new Event("input", { bubbles: true }));
      await inst.flush();
      expect(captured.map((l) => l.type)).toEqual(["click", "input"]);

      inst.options({ events: [] });
      btn.dispatchEvent(new Event("input", { bubbles: true }));
      await inst.flush();
      expect(captured).toHaveLength(2);
      inst.stop();
    } finally {
      Object.defineProperty(window, "location", {
        configurable: true,
        value: origLocation,
      });
    }
  });

  it("blocks all lockPrivacy() tampering paths while keeping manual audit inst.log() working cleanly", async () => {
    const exported: Logging.Log[] = [];
    const evilExporter = {
      export: jest.fn(async () => ({ success: true })),
    };

    const inst = createUserAle({
      url: "https://collector.example/logs",
      persistSession: false,
      events: ["click"],
      logDetails: false,
      privacy: {
        preset: "strict",
        ignoreUntrustedEvents: false,
        allowlistSelector: "[data-track]",
      },
      exporter: {
        export: async (logs) => {
          exported.push(...logs);
          return { success: true };
        },
        flush: async () => {},
        shutdown: async () => {},
      },
    });

    // Pre-lock callback attempts to re-inject forbidden fields and read Event
    let receivedEventArg: unknown = "unset";
    const cbRef = inst.addCallbacks({
      smuggle: (log: Logging.Log, evt: unknown) => {
        receivedEventArg = evt;
        return {
          ...log,
          pageUrl: "https://smuggled.example/phi",
          pageTitle: "Smuggled Title",
          details: { leaked: "secret" },
          location: { x: 99, y: 99 },
          target: "button#leaked",
          traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
          spanId: "00f067aa0ba902b7",
        };
      },
    });
    // Returned callback map is a shallow copy, not the live internal map
    cbRef.tamper = () => ({ hacked: true });

    inst.start();
    inst.lockPrivacy();
    expect(inst.isPrivacyLocked()).toBe(true);

    // Tampering attempts via options() are blocked
    inst.options({
      url: "https://evil.example/exfil",
      logDetails: true,
      persistSession: true,
      observeMutations: true,
      events: ["keydown"],
      privacy: { preset: "default", capturePageUrl: true },
    });
    expect(inst.options().url).toBe("https://collector.example/logs");
    expect(inst.options().logDetails).toBe(false);
    expect(inst.options().persistSession).toBe(false);
    expect(inst.options().observeMutations).toBe(false);
    expect(inst.options().privacy?.preset).toBe("strict");

    // Tampering via registerExporter / addCallbacks / details / startSessionReplay is blocked
    expect(inst.registerExporter(evilExporter)).toBe(false);
    expect(inst.addCallbacks({ late: (l: Logging.Log) => l })).toEqual({});
    expect(inst.details({ logDetails: true }, "input")).toBeNull();
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const stopReplay = inst.startSessionReplay({ onFlush: jest.fn() });
    expect(typeof stopReplay).toBe("function");
    expect(inst.getActiveReplayRingBuffer()).toBeNull();
    expect(warnSpy).toHaveBeenCalled();

    // DOM event passes allowlist, receives null Event in callback, and Stage-2 scrubs smuggled fields
    const btn = document.createElement("button");
    btn.setAttribute("data-track", "ok");
    document.body.appendChild(btn);
    btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    // packageCustomLog & log() still work for app audit events, but cannot bypass disabled fields
    inst.packageCustomLog(
      {
        type: "audit",
        pageUrl: "https://smuggled.example",
        details: { raw: "secret" },
        traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
      },
      () => ({ secretDetail: true }),
      true,
    );
    expect(
      inst.log({
        type: "manual-audit",
        action: "export",
        pageUrl: "https://smuggled.example",
        details: { nested: 1 },
        traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
      }),
    ).toBe(true);

    await inst.flush();
    expect(evilExporter.export).not.toHaveBeenCalled();
    expect(receivedEventArg).toBeNull();
    expect(exported).toHaveLength(3);

    for (const entry of exported) {
      expect(entry.hacked).toBeUndefined();
      expect(entry.traceId).toBeUndefined();
      expect(entry.spanId).toBeUndefined();
      if ("pageUrl" in entry) expect(entry.pageUrl).toBe("");
      if ("pageTitle" in entry) expect(entry.pageTitle).toBe("");
      if ("details" in entry) expect(entry.details).toBeNull();
    }
    expect(exported[0]!.location).toBeNull();
    expect(exported[0]!.target).toBe("");
    expect(exported[2]!.action).toBe("export");

    inst.stop();
  });

  it("resists <form><input name='...'> DOM clobbering, crosses Shadow DOM, and gives [data-userale-ignore] precedence over allowlistSelector", async () => {
    const exported: Logging.Log[] = [];
    const inst = createUserAle({
      url: "https://collector.example/logs",
      persistSession: false,
      logDetails: true,
      events: ["click", "input"],
      privacy: {
        allowlistSelector: "[data-app-action]",
        allowedAttributes: ["data-app-action", "data-id", "data-token"],
      },
      exporter: {
        export: async (logs) => {
          exported.push(...logs);
          return { success: true };
        },
        flush: async () => {},
        shutdown: async () => {},
      },
    });

    // DOM clobbering form with inputs named closest/parentNode/parentElement/id/attributes/className/style
    const form = document.createElement("form");
    form.setAttribute("id", "real-form");
    form.setAttribute("data-app-action", "submit-form");
    form.setAttribute("data-userale-redact", "true");
    for (const name of [
      "closest",
      "parentNode",
      "parentElement",
      "id",
      "attributes",
      "className",
      "style",
    ]) {
      const clobber = document.createElement("input");
      clobber.setAttribute("name", name);
      form.appendChild(clobber);
    }

    const redactInput = document.createElement("input");
    redactInput.setAttribute("data-app-action", "edit-ssn");
    redactInput.value = "123-45-6789";
    form.appendChild(redactInput);

    // Shadow DOM inside ignored container + inside allowed container
    const ignoredWrapper = document.createElement("div");
    ignoredWrapper.setAttribute("data-userale-ignore", "true");
    const ignoredHost = document.createElement("div");
    ignoredWrapper.appendChild(ignoredHost);
    const ignoredShadow = ignoredHost.attachShadow({ mode: "open" });
    const ignoredAllowBtn = document.createElement("button");
    ignoredAllowBtn.setAttribute("data-app-action", "should-be-ignored");
    ignoredShadow.appendChild(ignoredAllowBtn);

    const allowedWrapper = document.createElement("div");
    allowedWrapper.setAttribute("data-app-action", "shadow-action");
    allowedWrapper.setAttribute("data-id", "0042");
    allowedWrapper.setAttribute("data-token", "secret-should-drop");
    const allowedHost = document.createElement("div");
    allowedWrapper.appendChild(allowedHost);
    const allowedShadow = allowedHost.attachShadow({ mode: "open" });
    const shadowInnerBtn = document.createElement("button");
    shadowInnerBtn.textContent = "Go";
    allowedShadow.appendChild(shadowInnerBtn);

    document.body.append(form, ignoredWrapper, allowedWrapper);

    try {
      inst.start();
      // 1. Clobbered form subtree works & redacts input details cleanly
      redactInput.dispatchEvent(new Event("input", { bubbles: true }));
      // 2. Event inside ignored host Shadow DOM is suppressed despite [data-app-action]
      ignoredAllowBtn.dispatchEvent(
        new MouseEvent("click", { bubbles: true, composed: true }),
      );
      // 3. Event inside allowed host Shadow DOM passes allowlist and captures attributes from host wrapper
      shadowInnerBtn.dispatchEvent(
        new MouseEvent("click", { bubbles: true, composed: true }),
      );
      // 4. Direct click on clobbered form succeeds without TypeError
      form.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      await inst.flush();
      const rawLogs = exported.filter((l) => l.logType === "raw");
      expect(rawLogs).toHaveLength(3);
      expect(rawLogs[0]!.details).toEqual({ value: "[REDACTED]" });
      expect(rawLogs[1]!.attributes).toEqual({
        "data-app-action": "shadow-action",
        "data-id": "0042",
      });
      expect(rawLogs[2]!.target).toBe("form#real-form");
    } finally {
      inst.stop();
    }
  });

  it("extracts allowedAttributes from matched allowlist ancestor on nested <svg>/<span> clicks and supports structural/none/invalid allowlist", async () => {
    const exported: Logging.Log[] = [];
    const inst = createUserAle({
      url: "https://collector.example/logs",
      persistSession: false,
      events: ["click"],
      privacy: {
        allowlistSelector: "[data-app-action]",
        allowedAttributes: ["data-app-action", "data-count", "data-secret"],
        domSelectorMode: "structural",
      },
      exporter: {
        export: async (logs) => {
          exported.push(...logs);
          return { success: true };
        },
        flush: async () => {},
        shutdown: async () => {},
      },
    });

    const btn = document.createElement("button");
    btn.id = "save-btn";
    btn.className = "btn primary";
    btn.setAttribute("data-app-action", "save");
    btn.setAttribute("data-count", "007");
    btn.setAttribute("data-secret", "nope");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const svgPath = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    svg.appendChild(svgPath);
    btn.appendChild(svg);

    const nonMatchingDiv = document.createElement("div");
    nonMatchingDiv.id = "ignored-non-allowlist";
    document.body.append(btn, nonMatchingDiv);

    try {
      inst.start();
      svgPath.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      nonMatchingDiv.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await inst.flush();

      expect(exported).toHaveLength(1);
      expect(exported[0]!.target).toBe("path");
      expect(exported[0]!.path).toEqual([
        "path",
        "svg",
        "button",
        "body",
        "html",
        "#document",
        "Window",
      ]);
      // Extracted from <button data-app-action="save">, kept as raw strings (not JSON-parsed)
      expect(exported[0]!.attributes).toEqual({
        "data-app-action": "save",
        "data-count": "007",
      });

      // Invalid allowlistSelector fails closed
      const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      inst.options({ privacy: { allowlistSelector: "[invalid===" } });
      svgPath.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await inst.flush();
      expect(exported).toHaveLength(1);
      expect(errSpy).toHaveBeenCalled();
    } finally {
      inst.stop();
    }
  });

  it("validates default, strict-minimized, interval, custom, and mutation/replay logs against both log.schema.json files", async () => {
    const schemaPaths = [
      path.resolve(__dirname, "../../../../example/log.schema.json"),
      path.resolve(__dirname, "../../example/log.schema.json"),
    ];
    const schemas = schemaPaths.map((p) =>
      JSON.parse(fs.readFileSync(p, "utf8")),
    );
    expect(schemas[0]).toEqual(schemas[1]);

    const captured: Logging.Log[] = [];
    const strictInst = createUserAle({
      url: "https://collector.example/logs",
      persistSession: false,
      events: ["click", "mouseover"],
      privacy: {
        preset: "strict",
        ignoreUntrustedEvents: false,
      },
      exporter: {
        export: async (logs) => {
          captured.push(...logs);
          return { success: true };
        },
        flush: async () => {},
        shutdown: async () => {},
      },
    });

    const fullInst = createUserAle({
      url: "https://collector.example/logs",
      persistSession: false,
      sessionId: "sess-full",
      toolName: "demo",
      toolVersion: "1.0.0",
      events: ["click"],
      exporter: {
        export: async (logs) => {
          captured.push(...logs);
          return { success: true };
        },
        flush: async () => {},
        shutdown: async () => {},
      },
    });

    const b1 = document.createElement("button");
    b1.id = "b1";
    const b2 = document.createElement("button");
    b2.id = "b2";
    document.body.append(b1, b2);

    try {
      strictInst.start();
      b1.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      b2.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      b1.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      strictInst.packageCustomLog(
        { type: "custom_ev" },
        () => ({ ok: 1 }),
        true,
      );
      strictInst.packageCustomLog(
        { logType: "mutation", type: "mutation", target: "" },
        () => ({
          addedCount: 1,
          removedCount: 0,
          attributeCount: 0,
          targets: [],
        }),
        false,
      );
      strictInst.packageCustomLog(
        { logType: "replay", type: "session_replay", trigger: "manual" },
        () => ({ frames: [] }),
        false,
      );
      await strictInst.flush();

      fullInst.start();
      b1.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await fullInst.flush();

      expect(captured.length).toBeGreaterThanOrEqual(7);
      for (const entry of captured) {
        for (const schema of schemas) {
          const res = validate(entry, schema);
          expect(res.errors).toEqual([]);
          expect(res.valid).toBe(true);
        }
      }
    } finally {
      strictInst.stop();
      fullInst.stop();
    }
  });
});
